/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { IconButton, MultiButton, Row } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import styled from 'styled-components';

import { WarningBanner } from './warning-banner';

const StyledMultiBtn = styled(MultiButton)`
	border: 0.0625rem solid ${(props): string => props.theme.palette.warning.regular};
	height: 2rem;
	& > * {
		background-color: ${(props): string => props.theme.palette.transparent.regular} !important;
		cursor: pointer;
	}
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray6.focus};
	}
	svg {
		padding: 0 !important;
	}
`;

type ViewImagesDropdownItems = {
	id: string;
	label: string;
	onClick: () => void;
};
type BannerViewImagesProps = {
	setShowExternalImages: (show: boolean) => void;
	setDisplayBanner: (display: boolean) => void;
	items: Array<ViewImagesDropdownItems>;
};

export const BannerViewExternalImages = ({
	setShowExternalImages,
	setDisplayBanner,
	items
}: BannerViewImagesProps): React.JSX.Element => {
	const externalImagesMultiButtonLabel = useMemo(() => t('label.view_images', 'VIEW IMAGES'), []);
	const externalImageWarningLabel = useMemo(
		() =>
			t(
				'message.external_images_blocked',
				'External images have been blocked to protect you against potential spam'
			),
		[]
	);
	return (
		<WarningBanner warningLabel={externalImageWarningLabel}>
			<Row
				height="fit"
				orientation="vertical"
				display="flex"
				wrap="nowrap"
				mainAlignment="flex-end"
				padding={{ left: 'small' }}
				style={{
					flexGrow: 1,
					flexDirection: 'row'
				}}
			>
				<StyledMultiBtn
					background="transparent"
					type="outlined"
					label={externalImagesMultiButtonLabel}
					color="warning"
					onClick={(): void => {
						setShowExternalImages(true);
					}}
					dropdownProps={{
						maxWidth: '31.25rem',
						width: 'fit',
						items
					}}
					items={items}
				/>
				<IconButton
					icon="CloseOutline"
					onClick={(): void => setDisplayBanner(false)}
					customSize={{
						iconSize: 'large',
						paddingSize: 'small'
					}}
					size="small"
				/>
			</Row>
		</WarningBanner>
	);
};
