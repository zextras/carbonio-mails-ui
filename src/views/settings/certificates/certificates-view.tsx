/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import styled from '@emotion/styled';
import {
	Breadcrumbs,
	Container,
	Crumb,
	Divider,
	Row,
	useModal
} from '@zextras/carbonio-design-system';
import { useUpdateView } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { checkExistEncryptionPassword } from 'api/check-exist-password-api';
import { useSmimePasswordStore } from 'store/certificates/store';
import { CertificatePasswordModal } from 'views/settings/certificates/certificate-password-modal';
import { EnterPasswordModal } from 'views/settings/certificates/enter-password-modal';
import PersonalCertificatesSettings from 'views/settings/certificates/personal-certificates-settings';
import RecipientsCertificateSettings from 'views/settings/certificates/recipients-certificates-settings';

const CustomBreadcrumbs = styled(Breadcrumbs)`
	.breadcrumbCrumb {
		cursor: default;
	}
`;
const CertificatesView: FC = () => {
	useUpdateView();
	const { createModal, closeModal } = useModal();
	const isExistPasswordCheck = useRef(false);
	const id = Date.now().toString();
	const { smimePassword } = useSmimePasswordStore();
	const [t] = useTranslation();

	const crumbs = useMemo(
		(): Crumb[] => [
			{
				id: 'settings',
				label: t('settings.app', 'Settings'),
				className: 'breadcrumbCrumb'
			},
			{
				id: 'general',
				label: t('settings.smime_certificates', 'S/MIME Certificates'),
				className: 'breadcrumbCrumb'
			}
		],
		[t]
	);

	const onCertificatePassword = useCallback(
		(isReset?: boolean): void => {
			closeModal && closeModal(id);
			createModal(
				{
					id,
					size: 'medium',
					onClose: (): void => {
						closeModal?.(id);
					},
					children: (
						<Container crossAlignment="baseline">
							<CertificatePasswordModal isReset={isReset} onClose={(): void => closeModal?.(id)} />
						</Container>
					)
				},
				true
			);
		},
		[closeModal, createModal, id]
	);

	const onEnterPassword = useCallback((): void => {
		closeModal && closeModal(id);
		createModal(
			{
				id,
				size: 'medium',
				onClose: (): void => {
					closeModal?.(id);
				},
				children: (
					<Container crossAlignment="baseline">
						<EnterPasswordModal
							onPasswordReset={(): void => onCertificatePassword(true)}
							onClose={(): void => closeModal?.(id)}
						/>
					</Container>
				)
			},
			true
		);
	}, [closeModal, createModal, id, onCertificatePassword]);

	const onPasswordCheck = useCallback(
		(res: { data: Response } | { error: unknown }) => {
			if ('data' in res) {
				onEnterPassword();
			} else {
				onCertificatePassword(false);
			}
		},
		[onCertificatePassword, onEnterPassword]
	);

	useEffect(() => {
		if (!isExistPasswordCheck.current && (!smimePassword || smimePassword === '')) {
			isExistPasswordCheck.current = true;
			checkExistEncryptionPassword().then((res) => {
				onPasswordCheck(res);
			});
		}
	}, [isExistPasswordCheck, onPasswordCheck, smimePassword]);

	return (
		<>
			<Container
				orientation="vertical"
				mainAlignment="space-around"
				background={'gray5'}
				height="fit"
			>
				<Row
					padding={{ horizontal: 'small', vertical: 'medium' }}
					mainAlignment="flex-start"
					width="100%"
					crossAlignment="flex-start"
				>
					<CustomBreadcrumbs crumbs={crumbs} />
				</Row>
			</Container>
			<Divider />
			{smimePassword !== '' && (
				<Container
					orientation="vertical"
					mainAlignment="baseline"
					crossAlignment="baseline"
					background="gray5"
					gap="1rem"
					padding={{ all: 'medium' }}
					style={{ overflow: 'auto' }}
				>
					<PersonalCertificatesSettings />
					<RecipientsCertificateSettings />
				</Container>
			)}
		</>
	);
};

export default CertificatesView;
