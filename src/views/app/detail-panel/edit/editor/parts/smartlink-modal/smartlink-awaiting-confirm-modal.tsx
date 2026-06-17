/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

export const SmartlinkAwaitingConfirmModal = ({
	onConfirm,
	onClose
}: {
	onConfirm: () => void;
	onClose: () => void;
}): React.JSX.Element => {
	const [t] = useTranslation();

	const modalHeaderTitle = t('smart_link_modal.header.title', 'Upload attachment as Smart Link');

	const modalBodyText1 = t('smart_link_modal.body.text1', 'The attachment exceeds the size limit');

	const modalBodyText2 = t(
		'smart_link_modal.body.text2',
		'Would you like to convert it into a Smart Link?'
	);

	const modalFooterLabel = t('label.confirm', 'Confirm');

	const modalFooterSecondaryLabel = t('label.cancel', 'Cancel');

	return (
		<Container
			data-testid="convert-to-smartlink-modal"
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
				<Text>{modalBodyText1}</Text>
				<Text>{modalBodyText2}</Text>
				<ModalFooter
					onConfirm={onConfirm}
					secondaryAction={onClose}
					label={modalFooterLabel}
					secondaryLabel={modalFooterSecondaryLabel}
				/>
			</Container>
		</Container>
	);
};
