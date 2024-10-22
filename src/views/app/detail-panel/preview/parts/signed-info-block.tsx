/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback } from 'react';

import { Container, Icon, Link, Row, Tooltip, useModal } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { StoreProvider } from '../../../../../store/redux';
import { IncompleteMessage } from '../../../../../types';
import { getSignedIconColor } from '../utils';
import { InfoDetailsModal } from './info-details-modal/info-details-modal';

type SignedInfoProps = {
	msg: IncompleteMessage;
};
export const MailDetails: FC<SignedInfoProps> = ({ msg }): ReactElement => {
	const [t] = useTranslation();
	const { createModal, closeModal } = useModal();
	const signature = msg?.signature?.[0];
	const onSmimeClick = useCallback(() => {
		const modalId = Date.now().toString();
		signature &&
			createModal(
				{
					id: modalId,
					maxHeight: '90vh',
					children: (
						<StoreProvider>
							<InfoDetailsModal onClose={(): void => closeModal(modalId)} signature={signature} />
						</StoreProvider>
					)
				},
				true
			);
	}, [closeModal, createModal, signature]);

	return (
		<Container
			orientation="horizontal"
			padding={{ all: 'small' }}
			mainAlignment="flex-start"
			data-testid="show-details-container"
		>
			<Tooltip
				label={
					signature?.valid
						? t('label.valid_signature', 'Valid Signature')
						: t('label.invalid_signature', 'Invalid Signature')
				}
			>
				<Row>
					<Icon
						size="medium"
						icon={'SignatureOutline'}
						color={getSignedIconColor(signature?.messageCode ?? '')}
						style={{ alignSelf: 'center', paddingRight: '0.5rem' }}
					/>
				</Row>
			</Tooltip>
			<Link size="medium" onClick={onSmimeClick} data-testid="show-details-link">
				{t('label.show_details', 'Show Details')}
			</Link>
		</Container>
	);
};
