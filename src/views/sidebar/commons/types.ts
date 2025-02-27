/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SoapNotify } from '@zextras/carbonio-shell-ui';
import { StoreApi, UseBoundStore } from 'zustand';

import { TagState } from '../../../carbonio-ui-commons/types/tags';
import { FolderState } from '../../../types';

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
