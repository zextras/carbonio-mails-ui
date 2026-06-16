/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { noop } from 'lodash';
import { useTranslation } from 'react-i18next';

import { AnimatedLoaderUploading } from 'assets/animated-loader';

export const SmartlinkUploadingModal = ({
	onClose
}: {
	onClose: () => void;
}): React.JSX.Element => {
	const [t] = useTranslation();

	const modalHeaderTitle = t(
		'smart_link_modal.progress.title',
		'Uploading attachment as Smart Link'
	);

	const modalBodyText1 = t(
		'smart_link_modal.progress.text',
		'You are uploading a large attachment. This may take a moment, please wait'
	);

	const modalFooterLabel = t('label.uploading', 'Uploading');

	return (
		<Container
			data-testid="smart-link-uploading-modal"
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
			style={{
				overflowY: 'auto'
			}}
		>
			<ModalHeader title={modalHeaderTitle} onClose={onClose} />
			<Container
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
				style={{
					overflowY: 'auto'
				}}
			>
				<Text overflow="break-word">{modalBodyText1}</Text>
				<br />
				<ModalFooter
					onConfirm={noop}
					label={modalFooterLabel}
					primaryButtonIcon={AnimatedLoaderUploading}
					secondaryAction={onClose}
					secondaryLabel={t('label.cancel', 'Cancel')}
				/>
			</Container>
		</Container>
	);
};
