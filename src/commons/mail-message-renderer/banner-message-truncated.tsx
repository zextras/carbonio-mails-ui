/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Button } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import { WarningBanner } from './warning-banner';
import { AnimatedLoaderWarning } from '../../assets/animated-loader';

type BannerMessageTruncatedProps = {
	loadMessage: () => void;
	isLoadingMessage: boolean;
};

export const BannerMessageTruncated = ({
	loadMessage,
	isLoadingMessage
}: BannerMessageTruncatedProps): React.JSX.Element => {
	const truncatedWarningButtonLabel = useMemo(
		() => t('warningBanner.truncatedMessage.button', 'LOAD MESSAGE'),
		[]
	);
	const loadingMessageLabel = useMemo(
		() => t('warningBanner.truncatedMessage.loadingButton', 'LOADING...'),
		[]
	);
	const truncatedWarningLabel = useMemo(
		() =>
			t('warningBanner.truncatedMessage.label', 'The message is too large and has been cropped'),
		[]
	);
	return (
		<WarningBanner warningLabel={truncatedWarningLabel}>
			{isLoadingMessage ? (
				<Button
					backgroundColor="transparent"
					type="outlined"
					label={loadingMessageLabel}
					icon={AnimatedLoaderWarning}
					iconPlacement="left"
					color="warning"
					onClick={noop}
				/>
			) : (
				<Button
					backgroundColor="transparent"
					type="outlined"
					label={truncatedWarningButtonLabel}
					color="warning"
					onClick={loadMessage}
				/>
			)}
		</WarningBanner>
	);
};
