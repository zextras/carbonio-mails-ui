/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC } from 'react';

import { Icon, IconButton, Padding, Row, Text } from '@zextras/carbonio-design-system';
import styled from 'styled-components';

export const UploadingRow = styled(Row)`
	display: flex-start;
	mainalignment: flex-start;
	crossalignment: flex-start;
	heigth: 100%;
	padding-top: 0.25rem;
`;

export const UploadingAttachment: FC<{ uploadProgress: number; cancelUpload: () => void }> = ({
	uploadProgress,
	cancelUpload
}) => (
	<UploadingRow crossAlignment="flex-start" padding={{ right: 'small', bottom: 'large' }}>
		<Text color="gray1" size="medium">
			{uploadProgress}%
		</Text>
		<Padding right="extrasmall" />
		<Icon icon={'AnimatedLoader'} size="large" />
		<Padding right="extrasmall" />
		<IconButton
			icon="CloseCircleOutline"
			customSize={{ iconSize: 'large', paddingSize: 0 }}
			onClick={cancelUpload}
		/>
	</UploadingRow>
);
