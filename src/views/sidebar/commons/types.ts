/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SoapNotify } from '@zextras/carbonio-shell-ui';
import { StoreApi, UseBoundStore } from 'zustand';

import { TagState } from '../../../carbonio-ui-commons/types/tags';
import { FolderState, SoapConversation } from '../../../types';

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
