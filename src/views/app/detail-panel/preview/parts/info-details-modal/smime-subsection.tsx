/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Container, Divider, Icon, Padding, Row, Text } from '@zextras/carbonio-design-system';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

import { MessageSignature } from '../../../../../../types';
import { ErrorMessageCode } from '../../utils';

type SmimeDetailsModalProps = {
	signature: MessageSignature | undefined;
};

export const SmimeSubsection = ({ signature }: SmimeDetailsModalProps): React.JSX.Element => {
	const [t] = useTranslation();
	const signedMsgDetails = useMemo(() => {
		switch (signature?.messageCode) {
			case ErrorMessageCode.VALID:
				return {
					title: t('messages.modal.smime.valid_title', 'Message is Signed'),
					message: t(
						'messages.modal.smime.valid_msg',
						'This message includes a valid digital signature. The message has not been altered since it was sent.'
					),
					iconColor: 'success'
				};
			case ErrorMessageCode.INVALID:
				return {
					title: t('messages.modal.smime.invalid_title', 'Digital Signature is Not Valid'),
					message: t(
						'messages.modal.smime.invalid_msg',
						'This message includes a digital signature, but the signature is invalid.'
					),
					iconColor: 'error'
				};
			case ErrorMessageCode.UNTRUSTED:
				return {
					title: t('messages.modal.smime.untrusted_title', 'Message from an Untrusted Source'),
					message: t(
						'messages.modal.smime.untrusted_msg',
						'This message includes a digital signature, but the signer is not trusted. The certificate might not be issued by a recognized certificate authority.'
					),
					iconColor: 'warning'
				};
			case ErrorMessageCode.CERT_EXPIRED:
				return {
					title: t(
						'messages.modal.smime.cert_expired_title',
						`The Signer's Certificate Has Expired`
					),
					message: t(
						'messages.modal.smime.cert_expired_msg',
						`This message includes a digital signature, but the signer's certificate has expired. It is no longer considered valid.`
					),
					iconColor: 'error'
				};
			case ErrorMessageCode.CERT_NOT_FOUND:
				return {
					title: t('messages.modal.smime.cert_not_found_title', `Signer's Certificate Not Found`),
					message: t(
						'messages.modal.smime.cert_not_found_msg',
						`This message includes a digital signature, but the signer's certificate could not be found. The signature cannot be validated.`
					),
					iconColor: 'warning'
				};
			case ErrorMessageCode.ISSUER_NOT_FOUND:
				return {
					title: t('messages.modal.smime.issuer_not_found_title', `Issuer's Certificate Not Found`),
					message: t(
						'messages.modal.smime.issuer_not_found_msg',
						'This message includes a digital signature, but the certificate of the issuing authority could not be found.'
					),
					iconColor: 'warning'
				};
			default:
				return {
					title: t(
						'messages.modal.smime.error_title',
						'An Error Occurred During Signature Verification'
					),
					message: t(
						'messages.modal.smime.error_msg',
						'There was an error processing the digital signature. The signature could not be verified.'
					),
					iconColor: 'error'
				};
		}
	}, [signature?.messageCode, t]);

	if (!signature) return <></>;

	return (
		<Container
			mainAlignment="flex-start"
			orientation="vertical"
			crossAlignment="flex-start"
			data-testid="mail-info-subsection"
		>
			<Padding top={'large'} />
			<Divider />
			<Padding top={'large'} />
			<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
				<Icon
					size="medium"
					icon={'SignatureOutline'}
					color={signedMsgDetails.iconColor}
					style={{ alignSelf: 'center', paddingRight: '0.5rem' }}
				/>
				<Text weight="bold">{signedMsgDetails.title}</Text>
			</Row>{' '}
			<Padding top={'large'} />
			<Row mainAlignment="flex-start" padding={{ bottom: 'large' }}>
				<Text size="small" overflow="break-word">
					{signedMsgDetails.message}
				</Text>
			</Row>
			<Row padding={{ bottom: 'small' }}>
				<Text weight="bold" size="small" style={{ paddingRight: '0.25rem' }}>
					{t('messages.modal.smime.signed_by', 'Signed By')}:
				</Text>
				<Text size="small">{signature.email}</Text>
			</Row>
			<Row padding={{ bottom: 'small' }}>
				<Text weight="bold" size="small" style={{ paddingRight: '0.25rem' }}>
					{t('messages.modal.smime.issuer', 'Issuer')}:
				</Text>
				<Text size="small">{signature.issuer}</Text>
			</Row>
			<Row>
				<Text weight="bold" size="small" style={{ paddingRight: '0.25rem' }}>
					{t('messages.modal.smime.validity', 'Validity')}:
				</Text>
				<Text size="small">
					{moment(signature.notBefore).format('DD/MM/YYYY HH:MM')} -{' '}
					{moment(signature.notAfter).format('DD/MM/YYYY HH:MM')}
				</Text>
			</Row>
		</Container>
	);
};
