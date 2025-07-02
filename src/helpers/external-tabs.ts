/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { IS_FOCUS_MODE } from '@zextras/carbonio-shell-ui';

import { EML_ROUTE, FOCUS_MODE_MAIL_VIEW_ROUTE, FOCUS_MODE_ROUTE } from 'constants/index';
import { getLocationOrigin } from 'views/app/detail-panel/preview/utils/index';

export const isFocusModeMailView = (): boolean => IS_FOCUS_MODE;

export const openMessageStandalonePreview = ({
	folderId,
	messageId
}: {
	folderId: string;
	messageId: string;
}): void => {
	window.open(
		`${getLocationOrigin()}/carbonio/${FOCUS_MODE_ROUTE}/${FOCUS_MODE_MAIL_VIEW_ROUTE}/folder/${folderId}/message/${messageId}`
	);
};

export const openConversationStandalonePreview = ({
	folderId,
	conversationId
}: {
	folderId: string;
	conversationId: string;
}): void => {
	window.open(
		`${getLocationOrigin()}/carbonio/${FOCUS_MODE_ROUTE}/${FOCUS_MODE_MAIL_VIEW_ROUTE}/folder/${folderId}/conversation/${conversationId}`
	);
};

export const openEmlStandalonePreview = ({
	messageId,
	part
}: {
	messageId: string;
	part: string;
}): void => {
	window.open(
		`${getLocationOrigin()}/carbonio/${FOCUS_MODE_ROUTE}/${FOCUS_MODE_MAIL_VIEW_ROUTE}/${EML_ROUTE}/${messageId}/${part}`
	);
};
