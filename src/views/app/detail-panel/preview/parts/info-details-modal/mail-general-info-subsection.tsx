/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { FormSubSection, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

type MailGeneralInfoSubsectionProps = {
	messageIdFromMailHeaders: string | undefined;
	creationDateFromMailHeaders: string | undefined;
	isFromDistributionList: boolean | undefined;
};

export const MailGeneralInfoSubsection = ({
	messageIdFromMailHeaders,
	creationDateFromMailHeaders,
	isFromDistributionList
}: MailGeneralInfoSubsectionProps): React.JSX.Element => {
	const [t] = useTranslation();

	if (!messageIdFromMailHeaders && !creationDateFromMailHeaders) return <></>;

	return (
		<FormSubSection
			label={t('messages.modal.mail_general_info.title', 'General Information')}
			mainAlignment="flex-start"
			orientation="vertical"
			crossAlignment="flex-start"
			data-testid="mail-info-subsection"
		>
			{messageIdFromMailHeaders && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Text weight="bold" size="small">
						{t('messages.modal.mail_info.message_id', 'Message ID:')}
					</Text>
					<Padding right={'medium'} />
					<Text overflow={'break-word'} size="small">
						{messageIdFromMailHeaders}
					</Text>
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
			{isFromDistributionList && (
				<Row mainAlignment="flex-start" padding={{ top: 'small', bottom: 'small' }}>
					<Text weight="bold" size="small">
						{t('messages.modal.distribution_list', 'From Distribution List')}
					</Text>
				</Row>
			)}
		</FormSubSection>
	);
};
