/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SoapNotify } from '@zextras/carbonio-shell-ui';
import { FolderState, TagState } from '@zextras/carbonio-ui-commons';
import { StoreApi, UseBoundStore } from 'zustand';

import { IncompleteMessage } from 'types/messages';
import { SearchMessageHit } from 'types/soap/search';
import { SoapConversation } from 'types/soap/soap-conversation';
import { SoapIncompleteMessage } from 'types/soap/soap-mail-message';

export type OptionalExcept<T, K extends keyof T> = {
	[P in keyof T as P extends K ? P : never]: T[P];
} & {
	[P in keyof T as P extends K ? never : P]?: T[P];
};

export type HandleFoldersNotifyProps = {
	notifyList: Array<SoapNotify>;
	notify: SoapNotify;
	worker: Worker;
	store: UseBoundStore<StoreApi<FolderState>>;
};

export type HandleTagsNotifyProps = {
	notify: SoapNotify;
	worker: Worker;
	store: UseBoundStore<StoreApi<TagState>>;
};

// The items of a notification are summaries (ToXML.encodeItem with NOTIFY_FIELDS): a conversation never
// carries its messages nor its fragment, a message is encoded as a Search message hit
export type SoapNotifyConversation = Omit<SoapConversation, 'm' | 'fr'>;
export type SoapNotifyMessage = SearchMessageHit;
// a modified item carries only its id and what changed
export type SoapPartialConversation = OptionalExcept<SoapNotifyConversation, 'id'>;
export type SoapPartialNotifyMessage = OptionalExcept<SoapNotifyMessage, 'id'>;

// SoapNotify with the conversations and messages the shell types as unknown
export type MailsSoapNotify = Omit<SoapNotify, 'created' | 'modified'> & {
	created?: Omit<NonNullable<SoapNotify['created']>, 'c' | 'm'> & {
		c?: Array<SoapNotifyConversation>;
		m?: Array<SoapNotifyMessage>;
	};
	modified?: Omit<NonNullable<SoapNotify['modified']>, 'c' | 'm'> & {
		c?: Array<SoapPartialConversation>;
		m?: Array<SoapPartialNotifyMessage>;
	};
};
export type SoapPartialIncompleteMessage = OptionalExcept<SoapIncompleteMessage, 'id'>;
export type PartialIncompleteMessage = OptionalExcept<IncompleteMessage, 'id'>;

export type RetentionPolicyState = {
	showPolicy: boolean;
	dsblMsgDis: boolean;
	emptyDisValue: boolean;
	purgeValue: number | string;
	dspYear: string | null;
	dspRange: string;
};
