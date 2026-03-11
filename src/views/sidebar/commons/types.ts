/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SoapNotify } from '@zextras/carbonio-shell-ui';
import { FolderState, TagState } from '@zextras/carbonio-ui-commons';
import { StoreApi, UseBoundStore } from 'zustand';

import { IncompleteMessage } from 'types/messages';
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

export type SoapPartialConversation = OptionalExcept<SoapConversation, 'id'>;
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
