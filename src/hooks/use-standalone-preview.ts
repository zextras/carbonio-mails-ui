/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { IS_FOCUS_MODE } from '@zextras/carbonio-shell-ui';

import { MSG_PREVIEW_ROUTE } from '../constants';
import { getLocationOrigin } from '../views/app/detail-panel/preview/utils';

type UseStandalonePreviewPropsResult = {
	isStandalonePreview: () => boolean;
	openMessageStandalonePreview: (params: {
		folderId: string;
		messageId: string;
		subject?: string;
	}) => void;
	openConversationStandalonePreview: (params: {
		folderId: string;
		conversationId: string;
		subject?: string;
	}) => void;
	openEmlStandalonePreview: (params: {
		folderId: string;
		messageId: string;
		part: string;
		subject?: string;
	}) => void;
};

export const useStandalonePreview = (): UseStandalonePreviewPropsResult => {
	const isStandalonePreview = (): boolean =>
		IS_FOCUS_MODE && window.location.pathname.startsWith(`/carbonio/${MSG_PREVIEW_ROUTE}/`);

	const openMessageStandalonePreview = ({
		folderId,
		messageId,
		subject
	}: {
		folderId: string;
		messageId: string;
		subject?: string;
	}): void => {
		window.open(
			`${getLocationOrigin()}/carbonio/${MSG_PREVIEW_ROUTE}/folder/${folderId}/message/${messageId}`,
			subject
		);
	};

	const openConversationStandalonePreview = ({
		folderId,
		conversationId,
		subject
	}: {
		folderId: string;
		conversationId: string;
		subject?: string;
	}): void => {
		window.open(
			`${getLocationOrigin()}/carbonio/${MSG_PREVIEW_ROUTE}/folder/${folderId}/conversation/${conversationId}`,
			subject
		);
	};

	const openEmlStandalonePreview = ({
		folderId,
		messageId,
		part,
		subject
	}: {
		folderId: string;
		messageId: string;
		part: string;
		subject?: string;
	}): void => {
		window.open(
			`${getLocationOrigin()}/carbonio/${MSG_PREVIEW_ROUTE}/folder/${folderId}/message/${messageId}/${part}`,
			subject
		);
	};

	return {
		isStandalonePreview,
		openMessageStandalonePreview,
		openConversationStandalonePreview,
		openEmlStandalonePreview
	};
};
