/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback } from 'react';

import {
	Button,
	Container,
	FormSubSection,
	Padding,
	useModal
} from '@zextras/carbonio-design-system';

import { CertificatePasswordModal } from './certificate-password-modal';
import { EnterPasswordModal } from './enter-password-modal';
import type { AccountIdentity, IdentityProps } from '../../../types';

type RecipientsCertificateSettingsPropsType = {
	updatedIdentities?: AccountIdentity[];
	updateIdentities?: (arg: {
		target?: {
			name: string;
			value: string;
		};
		_attrs?: IdentityProps;
	}) => void;
};

const RecipientsCertificateSettings: FC<RecipientsCertificateSettingsPropsType> = ({
	updatedIdentities,
	updateIdentities
}): ReactElement => {
	const { createModal, closeModal } = useModal();
	const id = Date.now().toString();
	const onPasswordConfirm = useCallback((password: string) => {
		console.log('===>> onPasswordConfirm called');
	}, []);

	const onCertificatePassword = useCallback(
		(isReset?: boolean): void => {
			createModal(
				{
					id,
					size: 'medium',
					children: (
						<Container crossAlignment="baseline">
							<CertificatePasswordModal
								isReset={isReset}
								onConfirm={onPasswordConfirm}
								onClose={(): void => closeModal?.(id)}
							/>
						</Container>
					)
				},
				true
			);
		},
		[closeModal, createModal, id, onPasswordConfirm]
	);

	const onEnterPassword = useCallback((): void => {
		createModal(
			{
				id,
				size: 'medium',
				children: (
					<Container crossAlignment="baseline">
						<EnterPasswordModal
							emailAddress=""
							onPasswordReset={(): void => onCertificatePassword(true)}
							onConfirm={onPasswordConfirm}
							onClose={(): void => closeModal?.(id)}
						/>
					</Container>
				)
			},
			true
		);
	}, [closeModal, createModal, id, onCertificatePassword, onPasswordConfirm]);

	return (
		<>
			<FormSubSection
				label="Recipients certificates for encryption"
				id={''}
				padding={{ all: 'large' }}
			></FormSubSection>

			{/* This is temporary buttons to open password modal */}
			<FormSubSection label="Password for S/MIME operations" id={''} padding={{ all: 'large' }}>
				<Container crossAlignment="flex-start" orientation="horizontal" padding={{ all: 'medium' }}>
					<Button onClick={(): void => onCertificatePassword()} label="Create Password" />
					<Padding all="medium" />
					<Button onClick={(): void => onEnterPassword()} label="Enter Password" />
					<Padding all="medium" />
					<Button onClick={(): void => onCertificatePassword(true)} label="Reset Password" />
				</Container>
			</FormSubSection>
		</>
	);
};

export default RecipientsCertificateSettings;
