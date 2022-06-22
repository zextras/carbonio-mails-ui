/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { createContext, FC, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import {
	useIntegratedComponent,
	useTags,
	useUserAccount,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { SnackbarManagerContext, ModalManagerContext } from '@zextras/carbonio-design-system';
import { getActions as conversationActions } from '../ui-actions/conversation-actions';
import { getActions as messageActions } from '../ui-actions/message-actions';
import { MailMessage } from '../types/mail-message';
import { Conversation } from '../types/conversation';

type ACPProps = {
	folderId: string;
};

type ActionObj = {
	id: string;
	label: string;
	click: (event: MouseEvent) => void;
	icon: string;
};

type ActionList = Array<ActionObj>;

type GetMsgActionsFunction = (item: MailMessage, closeEditor: boolean) => [ActionList, ActionList];
type GetConvActionsFunction = (
	item: Conversation,
	closeEditor: boolean
) => [ActionList, ActionList];
export const ActionsContext = createContext<{
	getConversationActions: GetConvActionsFunction;
	getMessageActions: GetMsgActionsFunction;
}>({
	getConversationActions: (i: Conversation) => [[], []],
	getMessageActions: (i: MailMessage) => [[], []]
});

export const ActionsContextProvider: FC<ACPProps> = ({ children, folderId }) => {
	const [t] = useTranslation();
	const dispatch = useDispatch();
	const createSnackbar = useContext(SnackbarManagerContext);
	const createModal = useContext(ModalManagerContext);
	const settings = useUserSettings();
	const account = useUserAccount();
	const timezone = useMemo(() => settings?.prefs.zimbraPrefTimeZoneId, [settings]);
	const tags = useTags();

	const [ContactInput, integrationAvailable] = useIntegratedComponent('contact-input');

	const [conversationActionsCallback, messageActionsCallback] = useMemo(
		() => [
			conversationActions({
				folderId,
				t,
				dispatch,
				createSnackbar,
				createModal,
				ContactInput,
				tags,
				account
			}),
			messageActions({
				folderId,
				t,
				dispatch,
				createSnackbar,
				createModal,
				ContactInput,
				timezone,
				account,
				tags
			})
		],
		[folderId, t, dispatch, createSnackbar, createModal, ContactInput, tags, account, timezone]
	);
	const getMessageActions = useCallback<GetMsgActionsFunction>(
		(item: MailMessage, closeEditor: boolean): [ActionList, ActionList] =>
			messageActionsCallback(item, closeEditor),
		[messageActionsCallback]
	);
	const getConversationActions = useCallback<GetConvActionsFunction>(
		(item: Conversation): [ActionList, ActionList] => conversationActionsCallback(item),
		[conversationActionsCallback]
	);
	return (
		<ActionsContext.Provider value={{ getConversationActions, getMessageActions }}>
			{children}
		</ActionsContext.Provider>
	);
};
