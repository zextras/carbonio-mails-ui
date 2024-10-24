/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, Icon, Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

type MailGeneralInfoSubsectionProps = {
	messageIdFromMailHeaders: string | undefined;
	creationDateFromMailHeaders: string | undefined;
	isFromDistributionList: boolean | undefined;
	isFromExternalDomain: boolean | undefined;
	sensitivityValue: string | undefined;
};

export const MailGeneralInfoSubsection = ({
	messageIdFromMailHeaders,
	creationDateFromMailHeaders,
	isFromDistributionList,
	isFromExternalDomain,
	sensitivityValue
}: MailGeneralInfoSubsectionProps): React.JSX.Element => {
	const [t] = useTranslation();
	const headerLabel = t('messages.modal.mail_general_info.title', 'General Information');

	const showComponent =
		messageIdFromMailHeaders ||
		creationDateFromMailHeaders ||
		isFromDistributionList ||
		isFromExternalDomain ||
		sensitivityValue;

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
					<Text weight="bold" size="small">
						{t('messages.modal.mail_info.message_created_at', 'Created at:')}
					</Text>
					<Padding right={'medium'} />
					<Text overflow={'break-word'} size="small">
						{creationDateFromMailHeaders}
					</Text>
				</Row>
			)}
			{sensitivityValue && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Text weight="bold" size="small">
						{t('messages.modal.mail_info.message_sensitivity', 'Sensitivity:')}
					</Text>
					<Padding right={'medium'} />
					<Text overflow={'break-word'} size="small">
						{sensitivityValue}
					</Text>
				</Row>
			)}
			{isFromDistributionList && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Text weight="bold" size="small">
						{t('messages.modal.distribution_list', 'From Distribution List')}
					</Text>
				</Row>
			)}
			{isFromExternalDomain && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Text weight="bold" size="small">
						{t('messages.modal.external_domain', 'The sender is from an external domain')}
					</Text>
				</Row>
			)}
		</Container>
	);
};
