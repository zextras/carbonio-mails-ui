/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { Tag, useSortedTagsArray } from '@zextras/carbonio-ui-commons';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors, TIMEOUTS } from 'constants/index';
import { isSpam } from 'helpers/folders';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { msgActionEmailStoreAction } from 'store/emails/actions/msg-action-action';
import { UIActionAggregator, UIActionDescriptor } from 'types/actions';
import { MsgActionOperation, MsgActionResponse } from 'types/soap/msg-action';

export const useMsgApplyTagSubDescriptors = ({
	ids,
	messageTags,
	folderId
}: {
	ids: Array<string>;
	messageTags: Array<string>;
	folderId: string;
}): UIActionDescriptor[] => {
	const { createSnackbar } = useUiUtilities();
	const [t] = useTranslation();
	const tags = useSortedTagsArray();

	const getTagOperationDetails = useCallback(
		(
			isTagIncluded: boolean,
			tag: Tag
		): { operation: MsgActionOperation; icon: string; snackbarSuccessLabel: string } => {
			const operation = isTagIncluded ? '!tag' : 'tag';
			const icon = isTagIncluded ? 'TagOutline' : 'Tag';
			const snackbarSuccessLabel = isTagIncluded
				? t('snackbar.tag_removed', {
						tag: tag.name,
						defaultValue: '"{{tag}}" tag removed'
					})
				: t('snackbar.tag_applied', {
						tag: tag.name,
						defaultValue: '"{{tag}}" tag applied'
					});

			return { operation, icon, snackbarSuccessLabel };
		},
		[t]
	);

	const canExecute = (id: string): boolean => !isSpam(id);

	const handleApiResponse = useCallback(
		async (response: MsgActionResponse, snackbarSuccessLabel: string): Promise<void> => {
			if (!('Fault' in response)) {
				createSnackbar({
					key: 'tag',
					replace: true,
					hideButton: true,
					severity: 'info',
					label: snackbarSuccessLabel,
					autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT
				});
			} else {
				createSnackbar({
					key: 'tag',
					replace: true,
					severity: 'error',
					label: t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT,
					hideButton: true
				});
			}
		},
		[createSnackbar, t]
	);

	const tagActions = useMemo(
		() =>
			map(tags, (tag) => {
				const isTagIncluded = !!messageTags?.includes(tag.id);

				const { operation, icon, snackbarSuccessLabel } = getTagOperationDetails(
					isTagIncluded,
					tag
				);

				const execute = async (): Promise<void> => {
					if (canExecute(folderId)) {
						const res = await msgActionEmailStoreAction({ operation, ids, tagName: tag.name });
						handleApiResponse(res, snackbarSuccessLabel);
					}
				};

				return {
					id: tag.id,
					icon,
					label: tag.name,
					color: tag.color,
					execute,
					canExecute: () => canExecute(folderId)
				};
			}),
		[folderId, getTagOperationDetails, handleApiResponse, ids, messageTags, tags]
	);
	return useMemo(() => tagActions, [tagActions]);
};

export const useMsgApplyTagDescriptor = ({
	ids,
	messageTags,
	folderId
}: {
	ids: Array<string>;
	messageTags: Array<string>;
	folderId: string;
}): UIActionAggregator => {
	const [t] = useTranslation();
	const items = useMsgApplyTagSubDescriptors({
		ids,
		messageTags,
		folderId
	});
	return {
		id: MessageActionsDescriptors.APPLY_TAG.id,
		label: t('label.tag', 'Tag'),
		icon: 'TagsMoreOutline',
		items
	};
};
