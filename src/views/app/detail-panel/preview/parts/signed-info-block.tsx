/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback } from 'react';

import { Container, Icon, Link, Tooltip, useModal } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { SmimeDetailsModal } from './smime-details-modal';
import { StoreProvider } from '../../../../../store/redux';
import { IncompleteMessage } from '../../../../../types';

type SignedInfoProps = {
	msg: IncompleteMessage;
};
const SignedInfo: FC<SignedInfoProps> = ({ msg }): ReactElement => {
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
							<SmimeDetailsModal onClose={(): void => closeModal(modalId)} signature={signature} />
						</StoreProvider>
					)
				},
				true
			);
	}, [closeModal, createModal, signature]);

	return (
		<Container orientation="horizontal" padding={{ all: 'small' }} mainAlignment="flex-start">
			<Tooltip
				label={
					signature?.valid
						? t('label.valid_signature', 'Valid Signature')
						: t('label.invalid_signature', 'Invalid Signature')
				}
			>
				<Icon
					size="medium"
					icon={'SignatureOutline'}
					color={signature?.valid ? 'success' : 'error'}
					style={{ alignSelf: 'center', paddingRight: '0.25rem' }}
				/>
			</Tooltip>
			<Link size="small" onClick={onSmimeClick}>
				{t('label.show_details', 'Show Details')}
			</Link>
		</Container>
	);
};
export default SignedInfo;
