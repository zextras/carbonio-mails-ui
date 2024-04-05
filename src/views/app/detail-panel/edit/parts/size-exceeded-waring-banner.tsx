/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { WarningBanner } from './warning-banner';
import { getEditor } from '../../../../../store/zustand/editor/hooks/editors';
import { MailsEditorV2 } from '../../../../../types';

export const calculateMailSize = (editor: MailsEditorV2): number => {
	const saveDraftSize = editor?.size ?? 0;
	const totalSmartLinksSize = editor?.totalSmartLinksSize ?? 0;
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
	const editor = getEditor({ id: editorId });
	const editorSize = editor ? calculateMailSize(editor) : 0;

	useEffect(() => {
		setIsMailSizeWarning(editorSize > maxAllowedMailSize);
	}, [editorSize, maxAllowedMailSize, setIsMailSizeWarning]);

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
