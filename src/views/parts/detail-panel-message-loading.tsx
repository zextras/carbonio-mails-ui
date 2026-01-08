/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { Spinner } from '../../assets/spinner';

export const DetailPanelMessageLoading = (): React.JSX.Element => {
	const [t] = useTranslation();
	return (
		<Container
			style={{ overflowY: 'auto' }}
			height="fill"
			background="gray5"
			mainAlignment="center"
			crossAlignment="center"
		>
			<Spinner text={t('displayer.loading_message', 'Loading message, please wait...')} />
		</Container>
	);
};
