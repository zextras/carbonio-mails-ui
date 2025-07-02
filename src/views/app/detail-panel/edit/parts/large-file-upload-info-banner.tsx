/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useTranslation } from 'react-i18next';

import { WarningBanner } from 'views/app/detail-panel/edit/parts/warning-banner';

export const LargeFileUploadInfoBanner = (): JSX.Element => {
	const { t } = useTranslation();
	const warningText = t(
		'editor.info.bannerLargeAttachments',
		'You are uploading a large attachment. It may take a while, please be patient...'
	);
	return (
		<WarningBanner
			text={warningText}
			icon={'InfoOutline'}
			iconColor={'info'}
			bottomBorderColor="info"
		/>
	);
};
