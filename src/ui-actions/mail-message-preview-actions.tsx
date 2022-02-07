/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, {
	useContext,
	useMemo,
	FC,
	ReactElement,
	useRef,
	useLayoutEffect,
	useState,
	useCallback,
	useEffect
} from 'react';
import {
	Row,
	IconButton,
	SnackbarManagerContext,
	Tooltip,
	useModal,
	Dropdown,
	ThemeContext
} from '@zextras/carbonio-design-system';
import { difference, includes, map, slice } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import {
	useIntegratedComponent,
	useReplaceHistoryCallback,
	useAppContext,
	FOLDERS
} from '@zextras/carbonio-shell-ui';

import {
	deleteMsg,
	editAsNewMsg,
	editDraft,
	forwardMsg,
	moveMsgToTrash,
	redirectMsg,
	replyAllMsg,
	replyMsg,
	sendDraft,
	setMsgFlag,
	setMsgAsSpam,
	printMsg,
	showOriginalMsg,
	setMsgRead,
	moveMessageToFolder,
	deleteMessagePermanently
} from './message-actions';
import { MailMessage } from '../types/mail-message';
import { useSelection } from '../hooks/useSelection';

type MailMsgPreviewActionsType = {
	folderId: string;
	message: MailMessage;
	timezone: string;
};

function useOverflowCount(containerRef: React.RefObject<HTMLInputElement>): [number, () => void] {
	const [visibleActionsCount, setVisibleActionsCount] = useState<number>(0);
	const theme = useContext(ThemeContext);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const iconSize = parseInt(theme.sizes.icon.large, 10);
	const calculateVisibleActionsCount = useCallback(() => {
		if (containerRef && containerRef.current && containerRef?.current?.clientWidth > 0) {
			const value = Math.floor(containerRef.current.clientWidth / iconSize);
			setVisibleActionsCount(value);
		}
	}, [containerRef, iconSize]);

	useEffect(() => {
		window.addEventListener('resize', calculateVisibleActionsCount);
		return (): void => window.removeEventListener('resize', calculateVisibleActionsCount);
	}, [calculateVisibleActionsCount]);

	useEffect(() => {
		window.addEventListener('transitionend', calculateVisibleActionsCount);
		return (): void => window.removeEventListener('transitionend', calculateVisibleActionsCount);
	}, [calculateVisibleActionsCount]);

	return [visibleActionsCount, calculateVisibleActionsCount];
}

const MailMsgPreviewActions: FC<MailMsgPreviewActionsType> = ({
	message,
	folderId,
	timezone
}): ReactElement => {
	const [t] = useTranslation();
	const replaceHistory = useReplaceHistoryCallback();
	const createSnackbar = useContext(SnackbarManagerContext);
	const dispatch = useDispatch();
	const createModal = useModal();
	const ContactInput = useIntegratedComponent('contact-input');
	const { setCount } = useAppContext();
	const { deselectAll } = useSelection(folderId, setCount);
	const systemFolders = useMemo(
		() => [FOLDERS.INBOX, FOLDERS.SENT, FOLDERS.DRAFTS, FOLDERS.TRASH, FOLDERS.SPAM],
		[]
	);
	const actionContainerRef = useRef<HTMLInputElement>(null);

	const actions = useMemo(() => {
		const arr = [];

		if (message.parent === FOLDERS.DRAFTS) {
			arr.push(sendDraft(message.id, message, t, dispatch));
			arr.push(editDraft(message.id, folderId, t, replaceHistory));
			arr.push(
				moveMsgToTrash(
					[message.id],
					t,
					dispatch,
					createSnackbar,
					deselectAll,
					folderId,
					replaceHistory,
					message.conversation
				)
			);
			arr.push(setMsgFlag([message.id], message.flagged, t, dispatch));
		}
		if (
			message.parent === FOLDERS.INBOX ||
			message.parent === FOLDERS.SENT ||
			!includes(systemFolders, message.parent)
		) {
			// INBOX, SENT OR CREATED_FOLDER
			arr.push(replyMsg(message.id, folderId, t, replaceHistory));
			arr.push(replyAllMsg(message.id, folderId, t, replaceHistory));
			arr.push(forwardMsg(message.id, folderId, t, replaceHistory));
			arr.push(
				moveMsgToTrash(
					[message.id],
					t,
					dispatch,
					createSnackbar,
					deselectAll,
					folderId,
					replaceHistory,
					message.conversation
				)
			);
			arr.push(
				setMsgRead([message.id], message.read, t, dispatch, folderId, replaceHistory, deselectAll)
			);
			arr.push(moveMessageToFolder([message.id], t, dispatch, false, createModal, deselectAll));
			arr.push(printMsg(message.id, t, timezone));
			arr.push(setMsgFlag([message.id], message.flagged, t, dispatch));
			arr.push(redirectMsg(message.id, t, dispatch, createSnackbar, createModal, ContactInput));
			arr.push(editAsNewMsg(message.id, folderId, t, replaceHistory));
			arr.push(setMsgAsSpam([message.id], false, t, dispatch, replaceHistory));
			arr.push(showOriginalMsg(message.id, t));
		}

		if (message.parent === FOLDERS.TRASH) {
			arr.push(moveMessageToFolder([message.id], t, dispatch, true, createModal, deselectAll));
			arr.push(deleteMessagePermanently([message.id], t, dispatch, createModal, deselectAll));
		}
		if (message.parent === FOLDERS.SPAM) {
			arr.push(deleteMsg([message.id], t, dispatch, createSnackbar, createModal));
			arr.push(setMsgAsSpam([message.id], true, t, dispatch, replaceHistory));
			arr.push(printMsg(message.id, t, timezone));
			arr.push(showOriginalMsg(message.id, t));
		}
		return arr;
	}, [
		message,
		systemFolders,
		t,
		dispatch,
		folderId,
		replaceHistory,
		createSnackbar,
		deselectAll,
		createModal,
		timezone,
		ContactInput
	]);

	const [visibleActionsCount, calculateVisibleActionsCount] = useOverflowCount(actionContainerRef);

	useLayoutEffect(() => {
		calculateVisibleActionsCount();
	}, [calculateVisibleActionsCount]);

	const firstActions = useMemo(
		() => slice(actions, 0, visibleActionsCount - 1),
		[actions, visibleActionsCount]
	);
	const secondActions = useMemo(() => difference(actions, firstActions), [actions, firstActions]);
	const [open, setOpen] = useState(false);
	const onIconClick = useCallback((ev: { stopPropagation: () => void }): void => {
		ev.stopPropagation();
		setOpen((o) => !o);
	}, []);
	const onDropdownClose = useCallback((): void => {
		setOpen(false);
	}, []);
	return (
		<Row
			ref={actionContainerRef}
			mainAlignment="flex-end"
			takeAvailableSpace
			wrap="nowrap"
			style={{ overflow: 'hidden' }}
		>
			{actions &&
				map(firstActions, (action) => (
					<Tooltip key={`${message.id}-${action.icon}`} label={action.label}>
						<IconButton
							size="small"
							icon={action.icon}
							onClick={(ev: React.MouseEvent<HTMLButtonElement>): void => {
								if (ev) ev.preventDefault();
								action.click();
							}}
						/>
					</Tooltip>
				))}
			{secondActions?.length > 0 && (
				<Dropdown
					placement="right-end"
					items={secondActions}
					forceOpen={open}
					onClose={onDropdownClose}
				>
					<IconButton size="small" icon="MoreVertical" onClick={onIconClick} />
				</Dropdown>
			)}
		</Row>
	);
};

export default MailMsgPreviewActions;
