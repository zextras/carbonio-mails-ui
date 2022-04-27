/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';
import { filter } from 'lodash';
import {
	Container,
	Collapse,
	Row,
	IconButton,
	Icon,
	Padding,
	Badge,
	Text
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { useSelector } from 'react-redux';
import { selectFolders } from '../../../../../store/folders-slice';
import ContactNames from './contact-names';
import { MailMessage } from '../../../../../types/mail-message';

const MessageContactList: FC<{ message: MailMessage; folderId: string }> = ({
	message,
	folderId
}): ReactElement => {
	const [t] = useTranslation();
	const [open, setOpen] = useState(false);

	const toggleOpen = useCallback((e) => {
		e.preventDefault();
		setOpen((o) => !o);
	}, []);
	const folders = useSelector(selectFolders);

	const toContacts = useMemo(
		() => filter(message.participants, ['type', 't']),
		[message.participants]
	);
	const ccContacts = useMemo(
		() => filter(message.participants, ['type', 'c']),
		[message.participants]
	);
	const bccContacts = useMemo(
		() => filter(message.participants, ['type', 'b']),
		[message.participants]
	);
	const showCcBccContacts = useMemo(
		() => ccContacts.length > 0 || bccContacts.length > 0,
		[bccContacts.length, ccContacts.length]
	);

	const textReadValues = useMemo(() => {
		if (typeof message.read === 'undefined')
			return { color: 'text', weight: 'regular', badge: 'read', size: 'small' };
		return message.read
			? { color: 'text', weight: 'regular', badge: 'read', size: 'small' }
			: { color: 'primary', weight: 'bold', badge: 'unread', size: 'medium' };
	}, [message.read]);

	const messageFolder = useMemo(
		() => folders[message.parent.includes(':') ? folderId : message.parent],
		[folderId, folders, message.parent]
	);
	const labelTo = useMemo(() => `${t('label.to', 'To')}: `, [t]);
	const labelCc = useMemo(() => `${t('label.cc', 'CC')}: `, [t]);
	const labelBcc = useMemo(() => `${t('label.bcc', 'BCC')}: `, [t]);

	const showBadge = useMemo(
		() => messageFolder?.name && messageFolder.id !== folderId,
		[folderId, messageFolder]
	);
	return (
		<Container
			crossAlignment="flex-start"
			mainAlignment="flex-start"
			padding={{ bottom: 'small', left: 'small' }}
		>
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
					<Row padding={{ right: 'extrasmall' }} background="error"></Row>
				)}
				<Row
					height="fit"
					mainAlignment="space-between"
					crossAlignment="center"
					width={'calc(100% - 32px)'}
				>
					<Row
						width={showBadge ? 'calc(100% - 60px)' : '100%'}
						crossAlignment="flex-start"
						mainAlignment="flex-start"
					>
						{toContacts.length > 0 && <ContactNames contacts={toContacts} label={labelTo} />}
					</Row>
					<Row>
						{message.urgent && <Icon data-testid="UrgentIcon" color="error" icon="ArrowUpward" />}
						{showBadge && (
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
							<Row height="fit" width="100%" crossAlignment="flex-start" mainAlignment="flex-start">
								{ccContacts.length > 0 && <ContactNames contacts={ccContacts} label={labelCc} />}
							</Row>
							<Row height="fit" width="100%" crossAlignment="flex-start" mainAlignment="flex-start">
								{bccContacts.length > 0 && <ContactNames contacts={bccContacts} label={labelBcc} />}
							</Row>
						</Container>
					</Collapse>
				</Container>
			</Row>
		</Container>
	);
};

export default MessageContactList;
