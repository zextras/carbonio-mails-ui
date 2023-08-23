/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useEffect, useState } from 'react';

import { Container, Icon, IconButton, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import styled from 'styled-components';

import { TIMEOUTS } from '../../../../constants';
import { AttachmentUploadProcessStatus } from '../../../../types';

export const UploadingRow = styled(Row)`
	display: flex;
`;

export const AttachmentUploadStatus: FC<{
	uploadStatus: AttachmentUploadProcessStatus;
	cancelUpload: () => void;
}> = ({ uploadStatus, cancelUpload }) => {
	const [showCompleted, setShowCompleted] = useState<boolean>(false);

	/**
	 * Handle the visibility of the temporary notification for a completed upload
	 */
	useEffect(() => {
		let timer: ReturnType<typeof setTimeout> | null = null;
		if (uploadStatus.status === 'completed') {
			setShowCompleted(true);
			timer = setTimeout(() => {
				setShowCompleted(false);
			}, TIMEOUTS.COMPLETED_UPLOAD_NOTIFICATION_VISIBILITY);
		}

		return function cleanup() {
			timer && clearTimeout(timer);
		};
	}, [uploadStatus.status]);

	return (
		<UploadingRow padding={{ horizontal: 'small', vertical: 'small' }} crossAlignment={'center'}>
			{uploadStatus.status === 'running' && (
				<>
					<Text color="gray1" size="small">
						{uploadStatus.progress}%
					</Text>
					<Padding right="extrasmall" />

					<Icon icon={'AnimatedLoader'} color={'gray1'} size="large" />
					<Padding right="extrasmall" />
					<IconButton
						icon="CloseCircleOutline"
						customSize={{ iconSize: 'large', paddingSize: 0 }}
						onClick={cancelUpload}
					/>
				</>
			)}
			{uploadStatus.status === 'aborted' && (
				<Container mainAlignment={'center'} crossAlignment={'flex-end'} height={'fit'}>
					<Row>
						<Icon icon={'AlertCircle'} color={'error'} size="medium" />
					</Row>
					<Row>
						<Text size={'small'} color={'error'}>
							{t('label.upload_failed', 'Upload failed')}
						</Text>
					</Row>
				</Container>
			)}
			{uploadStatus.status === 'completed' && showCompleted && (
				<Row mainAlignment={'center'} crossAlignment={'flex-end'}>
					<Text size={'small'}>100%</Text>
					<Icon icon={'CheckmarkCircle2'} color={'success'} size="medium" />
				</Row>
			)}
		</UploadingRow>
	);
};
