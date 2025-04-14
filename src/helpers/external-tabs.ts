/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { IS_FOCUS_MODE } from '@zextras/carbonio-shell-ui';

import { EML_ROUTE, EXTERNAL_VIEW_ROUTE, FOCUS_MODE_ROUTE } from '../constants';
import { getLocationOrigin } from '../views/app/detail-panel/preview/utils';

export const isStandalonePreview = (): boolean =>
	IS_FOCUS_MODE &&
	window.location.pathname.startsWith(`/carbonio/${FOCUS_MODE_ROUTE}/${EXTERNAL_VIEW_ROUTE}/`);

export const openMessageStandalonePreview = ({
	folderId,
	messageId,
	subject
}: {
	folderId: string;
	messageId: string;
	subject?: string;
}): void => {
	window.open(
		`${getLocationOrigin()}/carbonio/${FOCUS_MODE_ROUTE}/${EXTERNAL_VIEW_ROUTE}/folder/${folderId}/message/${messageId}`,
		subject
	);
};

export const openConversationStandalonePreview = ({
	folderId,
	conversationId,
	subject
}: {
	folderId: string;
	conversationId: string;
	subject?: string;
}): void => {
	window.open(
		`${getLocationOrigin()}/carbonio/${FOCUS_MODE_ROUTE}/${EXTERNAL_VIEW_ROUTE}/folder/${folderId}/conversation/${conversationId}`,
		subject
	);
};

export const openEmlStandalonePreview = ({
	messageId,
	part,
	subject
}: {
	messageId: string;
	part: string;
	subject?: string;
}): void => {
	window.open(
		`${getLocationOrigin()}/carbonio/${FOCUS_MODE_ROUTE}/${EXTERNAL_VIEW_ROUTE}/${EML_ROUTE}/${messageId}/${part}`,
		subject
	);
};
