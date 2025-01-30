/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { WarningBanner } from './warning-banner';
import { useEditorsStore } from '../../../../../store/editor';
import { MailsEditorV2 } from '../../../../../types';

function calculateTotalSmartLinksSize(savedAttachments: MailsEditorV2['savedAttachments']): number {
	if (!savedAttachments) return 0;
	return savedAttachments.reduce(
		(acc, attachment) => (attachment.requiresSmartLinkConversion ? acc + attachment.size : acc),
		0
	);
}
export const calculateMailSize = (editor: MailsEditorV2): number => {
	const saveDraftSize = editor?.size ?? 0;
	const totalSmartLinksSize = calculateTotalSmartLinksSize(editor.savedAttachments);
	return saveDraftSize - totalSmartLinksSize * 0.9;
};

export const SizeExceededWarningBanner = ({
	editorId,
	isMailSizeWarning,
	setIsMailSizeWarning
}: {
	editorId: MailsEditorV2['id'];
	isMailSizeWarning: boolean;
	setIsMailSizeWarning: (isMailSizeWarning: boolean) => void;
}): JSX.Element => {
	const maxMessageSize = useUserSettings().attrs?.zimbraMtaMaxMessageSize;
	const { t } = useTranslation();
	const maxAllowedMailSize = parseInt(maxMessageSize as string, 10);
	const editor = useEditorsStore((state) => state.editors[editorId]);
	const calculatedEditorSize = editor ? calculateMailSize(editor) : 0;

	useEffect(() => {
		setIsMailSizeWarning(calculatedEditorSize > maxAllowedMailSize);
	}, [calculatedEditorSize, maxAllowedMailSize, setIsMailSizeWarning]);

	const mailSizeWarningBannerText = t(
		'editor.warning.mail_size_exceeds_limit',
		'The message size exceeds the limit. Please convert some attachments to smart links.'
	);
	const mailSizeWarningBannerIcon = 'CloseCircleOutline';
	const mailSizeWarningBannerIconColor = 'error';
	return editor && isMailSizeWarning ? (
		<WarningBanner
			text={mailSizeWarningBannerText}
			icon={mailSizeWarningBannerIcon}
			iconColor={mailSizeWarningBannerIconColor}
			bottomBorderColor="error"
		/>
	) : (
		<></>
	);
};
