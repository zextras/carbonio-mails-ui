/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback } from 'react';

import { Container, Icon, Link, useModal } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { SmimeDetailsModal } from './smime-details-modal';
import { StoreProvider } from '../../../../../store/redux';

type SignedInfoProps = {
	msgId: string;
};
const SignedInfo: FC<SignedInfoProps> = ({ msgId }): ReactElement => {
	const [t] = useTranslation();
	const { createModal, closeModal } = useModal();

	const onSmimeClick = useCallback(() => {
		const modalId = Date.now().toString();
		createModal(
			{
				id: modalId,
				maxHeight: '90vh',
				children: (
					<StoreProvider>
						<SmimeDetailsModal onClose={(): void => closeModal(modalId)} />
					</StoreProvider>
				)
			},
			true
		);
	}, [closeModal, createModal]);

	return (
		<Container orientation="horizontal" padding={{ all: 'small' }} mainAlignment="flex-start">
			<Icon
				size="medium"
				icon={'SignatureOutline'}
				color={'primary'}
				style={{ alignSelf: 'center', paddingRight: '0.25rem' }}
			/>
			<Link size="small" onClick={onSmimeClick}>
				{t('label.show_details', 'Show Details')}
			</Link>
		</Container>
	);
};
export default SignedInfo;
