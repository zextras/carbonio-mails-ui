/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { NodeWithMetadata } from 'types/integrations/carbonio-files-ui';

export type CreateLinkType = {
	node: Pick<NodeWithMetadata, 'id' | '__typename'>;
	description?: string;
	expiresAt?: number;
	type: 'createLink';
};

export type Link = {
	__typename?: 'Link';
	id: string;
	url?: string | null;
	description?: string | null;
	expires_at?: number | null;
	created_at: number;
	node: Pick<NodeWithMetadata, 'id' | '__typename'>;
};
