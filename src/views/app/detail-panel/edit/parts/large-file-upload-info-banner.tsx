/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useTranslation } from 'react-i18next';

import { WarningBanner } from './warning-banner';

export const LargeFileUploadInfoBanner = (): JSX.Element => {
	const { t } = useTranslation();
	const mailSizeWarningBannerText = t(
		'editor.warning.mail_size_exceeds_limit',
		'The message size exceeds the limit. Please convert some attachments to smart links.'
	);
	const mailSizeWarningBannerIcon = 'CloseCircleOutline';
	const mailSizeWarningBannerIconColor = 'error';
	return (
		<WarningBanner
			text={'large-file-upload-info-banner'}
			icon={mailSizeWarningBannerIcon}
			iconColor={'info'}
			bottomBorderColor="error"
		/>
	);
};
