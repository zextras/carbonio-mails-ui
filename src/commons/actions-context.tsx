/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { DropdownItem } from '@zextras/carbonio-design-system';
import {
	useIntegratedComponent,
	useTags,
	useUserAccount,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';
import React, { createContext, FC, useCallback, useMemo } from 'react';
import { useAppDispatch } from '../hooks/redux';
import { Conversation, MailMessage } from '../types';
import { getActions as conversationActions } from '../ui-actions/conversation-actions';
import { getActions as messageActions } from '../ui-actions/message-actions';

type ACPProps = {
	folderId: string;
	isConversation?: boolean;
};

type ActionObj = DropdownItem & {
	icon: NonNullable<DropdownItem['icon']>;
	onClick: NonNullable<DropdownItem['onClick']>;
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
	const dispatch = useAppDispatch();
	const settings = useUserSettings();
	const account = useUserAccount();
	const timezone = useMemo(() => settings?.prefs.zimbraPrefTimeZoneId, [settings]);
	const tags = useTags();

	const [ContactInput] = useIntegratedComponent('contact-input');

	const [conversationActionsCallback, messageActionsCallback] = useMemo(
		() => [
			conversationActions({
				folderId,
				dispatch,
				tags,
				account,
				deselectAll: noop
			}),
			messageActions({
				folderId,

				dispatch,
				account,
				tags,
				deselectAll: noop
			})
		],
		[folderId, dispatch, tags, account]
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
