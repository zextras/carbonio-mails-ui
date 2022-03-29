/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useUserAccounts } from '@zextras/carbonio-shell-ui';
import { capitalize, filter, map } from 'lodash';
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';
import {
	Container,
	Collapse,
	Row,
	IconButton,
	Text,
	Icon,
	Padding,
	Badge
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { participantToString } from '../../../../../commons/utils';
import { selectFolders } from '../../../../../store/folders-slice';

const ContactText = styled(Text)`
	&:not(:first-child) {
		&:before {
			content: '|';
			padding: 0 4px;
		}
	}
`;
const MessageContactList: FC<{ message: any; folderId: string }> = ({
	message,
	folderId
}): ReactElement => {
	const [t] = useTranslation();
	const [open, setOpen] = useState(false);

	const toggleOpen = useCallback((e) => {
		e.preventDefault();
		setOpen((o) => !o);
	}, []);

	const accounts = useUserAccounts();
	const toContacts = filter(message.participants, ['type', 't']);
	const ccContacts = filter(message.participants, ['type', 'c']);
	const bccContacts = filter(message.participants, ['type', 'b']);
	const showCcBccContacts = useMemo(
		() => ccContacts.length > 0 || bccContacts.length > 0,
		[bccContacts.length, ccContacts.length]
	);
	const folders = useSelector(selectFolders);
	const textReadValues = useMemo(() => {
		if (typeof message.read === 'undefined')
			return { color: 'text', weight: 'regular', badge: 'read', size: 'small' };
		return message.read
			? { color: 'text', weight: 'regular', badge: 'read', size: 'small' }
			: { color: 'primary', weight: 'bold', badge: 'unread', size: 'medium' };
	}, [message.read]);
	const messageFolder = folders[message.parent.includes(':') ? folderId : message.parent];
	return (
		<Container crossAlignment="flex-start" mainAlignment="flex-start" padding={{ bottom: 'small' }}>
			<Row
				takeAvailableSpace
				style={{ width: '100%', padding: 0 }}
				crossAlignment="center"
				mainAlignment="flex-start"
			>
				{showCcBccContacts ? (
					<Row padding={{ right: 'extrasmall' }}>
						<IconButton
							size="small"
							icon={open ? 'ChevronUp' : 'ChevronDown'}
							onClick={toggleOpen}
						/>
					</Row>
				) : (
					<Row padding={{ right: 'extrasmall' }} background="error" style={{ width: '24px' }}></Row>
				)}
				<Row
					height="fit"
					mainAlignment="space-between"
					crossAlignment="center"
					width={'calc(100% - 32px)'}
				>
					<Row>
						{toContacts.length > 0 && (
							<ContactText color="gray1" size="extrasmall" data-testid="ToParticipants">
								{`${t('label.to', 'To')}: `}
								{map(toContacts, (contact) =>
									capitalize(participantToString(contact, t, accounts))
								).join(', ')}
							</ContactText>
						)}
					</Row>
					<Row>
						{message.urgent && <Icon data-testid="UrgentIcon" color="error" icon="ArrowUpward" />}
						{messageFolder?.name && messageFolder.id !== folderId && (
							<Padding left="small">
								<Badge
									data-testid="FolderBadge"
									value={messageFolder.name}
									type={textReadValues.badge}
								/>
							</Padding>
						)}
					</Row>
				</Row>
			</Row>

			<Row padding={{ left: 'medium' }} width="calc(100% - 24px)">
				<Container width="calc(100% - 24px)" crossAlignment="flex-start">
					<Collapse orientation="vertical" crossSize="100%" open={open}>
						<Container width="100%" padding={{ left: 'extrasmall' }}>
							<Container height="fit" width="100%" crossAlignment="flex-start">
								{ccContacts.length > 0 && (
									<ContactText color="gray1" size="extrasmall" data-testid="CcParticipants">
										{`${t('label.cc', 'CC')}: `}
										{map(ccContacts, (contact) =>
											capitalize(participantToString(contact, t, accounts))
										).join(', ')}
									</ContactText>
								)}
							</Container>
							<Container height="fit" crossAlignment="flex-start" padding={{ top: 'extrasmall' }}>
								{bccContacts.length > 0 && (
									<ContactText color="gray1" size="extrasmall">
										{`${t('label.bcc', 'BCC')}: `}
										{map(bccContacts, (contact) =>
											capitalize(participantToString(contact, t, accounts))
										).join(', ')}
									</ContactText>
								)}
							</Container>
						</Container>
					</Collapse>
				</Container>
			</Row>
		</Container>
	);
};

export default MessageContactList;
