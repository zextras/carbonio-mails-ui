/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { WarningBanner } from './warning-banner';
import { getEditor } from '../../../../../store/zustand/editor/hooks/editors';
import { MailsEditorV2 } from '../../../../../types';

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
	// FIXME: maxMessageSize fallback to 10MB for testing purposes
	const maxAllowedMailSize = maxMessageSize
		? // casting to string as they type definition in shell is not correct
		  // remove once the type definition is corrected
		  parseInt(maxMessageSize as string, 10)
		: 10000000;
	const editor = getEditor({ id: editorId });
	const saveDraftSize = editor?.size ?? 0;
	const totalSmartLinksSize = editor?.totalSmartLinksSize ?? 0;
	const expectedNewMailSize = saveDraftSize - totalSmartLinksSize * 0.9;
	setIsMailSizeWarning(expectedNewMailSize > maxAllowedMailSize);
	const mailSizeWarningBannerText = t(
		'editor.warning.mail_size_exceeds_limit',
		'The message size exceeds the limit. Please convert some attachments to smart links.'
	);
	const mailSizeWarningBannerIcon = 'AlertCircleOutline';
	const mailSizeWarningBannerIconColor = 'info';
	return isMailSizeWarning ? (
		<WarningBanner
			text={mailSizeWarningBannerText}
			icon={mailSizeWarningBannerIcon}
			iconColor={mailSizeWarningBannerIconColor}
		/>
	) : (
		<></>
	);
};
