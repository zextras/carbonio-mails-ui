/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, Icon, Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

type MailGeneralInfoSubsectionProps = {
	messageIdFromMailHeaders?: string;
	creationDateFromMailHeaders?: string;
	messageIsFromDistributionList?: boolean;
	messageIsFromExternalDomain?: boolean;
	sensitivityValue?: string;
};

export const MailGeneralInfoSubsection = ({
	messageIdFromMailHeaders,
	creationDateFromMailHeaders,
	messageIsFromDistributionList,
	messageIsFromExternalDomain,
	sensitivityValue
}: MailGeneralInfoSubsectionProps): React.JSX.Element => {
	const [t] = useTranslation();
	const headerLabel = t('messages.modal.mail_general_info.title', 'General Information');

	const showComponent =
		messageIdFromMailHeaders ??
		creationDateFromMailHeaders ??
		(messageIsFromDistributionList || messageIsFromExternalDomain || sensitivityValue);

	if (!showComponent) return <></>;

	return (
		<Container
			mainAlignment="flex-start"
			orientation="vertical"
			crossAlignment="flex-start"
			data-testid="mail-info-subsection"
		>
			<Padding top={'medium'} />
			<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
				<Icon
					size="medium"
					icon={'InfoOutline'}
					style={{ alignSelf: 'center', paddingRight: '0.5rem' }}
				/>
				<Text weight="bold">{headerLabel}</Text>
			</Row>
			<Padding top={'medium'} />
			{messageIdFromMailHeaders && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Tooltip placement="top" maxWidth="fit" label={messageIdFromMailHeaders}>
						<Text size="small">
							<strong>{t('messages.modal.mail_info.message_id', 'Message ID:')}</strong>{' '}
							{messageIdFromMailHeaders}
						</Text>
					</Tooltip>
				</Row>
			)}
			{creationDateFromMailHeaders && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Text size="small">
						<strong>{t('messages.modal.mail_info.message_created_at', 'Created at:')}</strong>{' '}
						{creationDateFromMailHeaders}
					</Text>
				</Row>
			)}
			{sensitivityValue && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Text size="small">
						<strong>{t('messages.modal.mail_info.message_sensitivity', 'Sensitivity:')}</strong>{' '}
						{sensitivityValue}
					</Text>
				</Row>
			)}
			{messageIsFromDistributionList && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Text weight="bold" size="small">
						{t('messages.modal.distribution_list', 'This email is from a Distribution List')}
					</Text>
				</Row>
			)}
			{messageIsFromExternalDomain && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Text weight="bold" size="small">
						{t('messages.modal.external_domain', 'This email is from an External Domain')}
					</Text>
				</Row>
			)}
		</Container>
	);
};
