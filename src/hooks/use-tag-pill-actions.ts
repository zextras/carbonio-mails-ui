/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { ErrorSoapBodyResponse } from '@zextras/carbonio-ui-soap-lib';
import { useTranslation } from 'react-i18next';

import { TIMEOUTS } from 'constants/index';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { convActionEmailStoreAction } from 'store/emails/actions/conv-action-action';
import { msgActionEmailStoreAction } from 'store/emails/actions/msg-action-action';

/** How long the snackbar of a removed tag offers Undo, as the other snackbars with Undo. */
const UNDO_SNACKBAR_TIMEOUT = 5000;

/** Each Undo snackbar has its own key: closing one late never closes the one that replaced it. */
let undoSnackbarCount = 0;

type HoldReason = 'pointer' | 'focus';

/**
 * Calls `onEnd` after `ms`, but not while something holds it (the pointer on the snackbar, the focus
 * in it): released, it starts again from `ms`, so there is always time to reach Undo.
 */
const holdableTimeout = (
	ms: number,
	onEnd: () => void
): {
	hold: (reason: HoldReason) => void;
	release: (reason: HoldReason) => void;
	cancel: () => void;
} => {
	const holds = new Set<HoldReason>();
	let timeout: ReturnType<typeof setTimeout> | undefined = setTimeout(onEnd, ms);
	let cancelled = false;
	const stop = (): void => {
		clearTimeout(timeout);
		timeout = undefined;
	};
	return {
		hold: (reason): void => {
			holds.add(reason);
			stop();
		},
		release: (reason): void => {
			holds.delete(reason);
			if (holds.size === 0 && timeout === undefined && !cancelled) {
				timeout = setTimeout(onEnd, ms);
			}
		},
		cancel: (): void => {
			cancelled = true;
			stop();
		}
	};
};

type TagPillActionsTarget = {
	/** A message: the tag changes on it only. A conversation: on every message of it. */
	kind: 'message' | 'conversation';
	ids: Array<string>;
};

export type TagPillActions = {
	/**
	 * Removes the tag, without confirmation; the snackbar offers Undo, then `onUndo` is called.
	 * `undoMessageIds`: Undo tags these messages only, those that had the tag (a conversation's messages
	 * don't all have each of its tags).
	 */
	removeTag: (
		tagName: string,
		options?: { onUndo?: () => void; onError?: () => void; undoMessageIds?: Array<string> }
	) => void;
	/** Applies or removes the tag at once, without a snackbar (the tag menu). */
	toggleTag: (tagName: string, apply: boolean) => void;
};

const isFault = (response: unknown): response is ErrorSoapBodyResponse =>
	typeof response === 'object' && response !== null && 'Fault' in response;

/** Whether the server did it: a fault, or a request that never got an answer, is a failure. */
const succeeded = (request: Promise<unknown>): Promise<boolean> =>
	request.then(
		(response) => !isFault(response),
		() => false
	);

/** What the tag pills of the reading pane do to the message or conversation they belong to. */
export const useTagPillActions = ({ kind, ids }: TagPillActionsTarget): TagPillActions => {
	const [t] = useTranslation();
	const { createSnackbar } = useUiUtilities();

	const runTagAction = useCallback(
		(operation: 'tag' | '!tag', tagName: string): Promise<unknown> =>
			kind === 'message'
				? msgActionEmailStoreAction({ operation, ids, tagName })
				: convActionEmailStoreAction({ operation, ids, tagName }),
		[ids, kind]
	);

	const showError = useCallback(
		() =>
			createSnackbar({
				key: 'tag',
				replace: true,
				severity: 'error',
				label: t('label.error_try_again', 'Something went wrong, please try again'),
				autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT,
				hideButton: true
			}),
		[createSnackbar, t]
	);

	const undoRemoval = useCallback(
		async (tagName: string, undoMessageIds: Array<string> | undefined, onUndo?: () => void) => {
			// Without the messages (not loaded), the tag goes back on the whole target
			const undo = undoMessageIds?.length
				? msgActionEmailStoreAction({ operation: 'tag', ids: undoMessageIds, tagName })
				: runTagAction('tag', tagName);
			if (await succeeded(undo)) {
				onUndo?.();
			} else {
				showError();
			}
		},
		[runTagAction, showError]
	);

	const removeTag = useCallback<TagPillActions['removeTag']>(
		(tagName, options) => {
			succeeded(runTagAction('!tag', tagName)).then((ok) => {
				if (!ok) {
					showError();
					options?.onError?.();
					return;
				}
				// The snackbar's own timer doesn't wait for the pointer or the focus: this one does.
				undoSnackbarCount += 1;
				let close = (): void => undefined;
				const timer = holdableTimeout(UNDO_SNACKBAR_TIMEOUT, () => close());
				close = createSnackbar({
					key: `tag-undo-${undoSnackbarCount}`,
					replace: true,
					severity: 'info',
					label: t('snackbar.tag_removed', {
						tag: tagName,
						defaultValue: '"{{tag}}" tag removed'
					}),
					disableAutoHide: true,
					hideButton: false,
					actionLabel: t('label.undo', 'Undo'),
					onMouseEnter: () => timer.hold('pointer'),
					onMouseLeave: () => timer.release('pointer'),
					onFocus: () => timer.hold('focus'),
					onBlur: () => timer.release('focus'),
					onActionClick: () => {
						timer.cancel();
						undoRemoval(tagName, options?.undoMessageIds, options?.onUndo);
					}
				});
			});
		},
		[createSnackbar, runTagAction, showError, t, undoRemoval]
	);

	const toggleTag = useCallback<TagPillActions['toggleTag']>(
		(tagName, apply) => {
			succeeded(runTagAction(apply ? 'tag' : '!tag', tagName)).then((ok) => {
				if (!ok) {
					showError();
				}
			});
		},
		[runTagAction, showError]
	);

	return useMemo(() => ({ removeTag, toggleTag }), [removeTag, toggleTag]);
};
