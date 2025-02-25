/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StoreApi, UseBoundStore } from 'zustand';

import { Tag, TagState } from '../../../carbonio-ui-commons/types/tags';
import {
	FolderState,
	SoapConversation,
	SoapFolder,
	SoapIncompleteMessage,
	SoapLink
} from '../../../types';

export type SoapNotify = {
	seq: number;
	created?: {
		m?: Array<SoapIncompleteMessage>;
		c?: Array<SoapConversation>;
		folder?: Array<SoapFolder>;
		link?: Array<SoapLink>;
		tag?: Array<Tag>;
	};
	modified?: {
		m?: Array<SoapIncompleteMessage>;
		c?: Array<SoapConversation>;
		folder?: Array<Partial<SoapFolder>>;
		link?: Array<Partial<SoapLink>>;
		tag?: Array<Partial<Tag>>;
		mbx: [
			{
				s: number;
			}
		];
	};
	deleted?: { id: string };
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
