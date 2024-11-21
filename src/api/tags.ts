/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { soapFetch } from '@zextras/carbonio-shell-ui';

import { Tag } from '../carbonio-ui-commons/types/tags';

export type CreateTagRequest = {
	tag: Omit<Tag, 'id'>;
};

export type CreateTagResponse = {
	tag: [Tag];
};

export type TagActionRequest = {
	action: {
		op: 'rename' | 'color' | 'delete' | 'update';
		id: string;
		name?: string;
		color?: number;
		rgb?: string;
	};
};

export type TagActionResponse = {
	action: { op: string; id: string };
};

export const createTag = (tag: Omit<Tag, 'id'>): Promise<CreateTagResponse> =>
	soapFetch<CreateTagRequest, CreateTagResponse>('CreateTag', {
		tag
	});

export const deleteTag = (id: string): Promise<TagActionResponse> =>
	soapFetch<TagActionRequest, TagActionResponse>('TagAction', {
		action: { op: 'delete', id }
	});

export const renameTag = (id: string, name: string): Promise<TagActionResponse> =>
	soapFetch<TagActionRequest, TagActionResponse>('TagAction', {
		action: { op: 'rename', id, name }
	});

export const changeTagColor = (id: string, color: string | number): Promise<TagActionResponse> =>
	soapFetch<TagActionRequest, TagActionResponse>('TagAction', {
		action: typeof color === 'number' ? { op: 'color', color, id } : { op: 'color', rgb: color, id }
	});
