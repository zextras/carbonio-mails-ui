/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	FC,
	ReactElement,
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { filter } from 'lodash';
import {
	Container,
	Row,
	IconButton,
	Icon,
	Padding,
	Tooltip,
	Badge
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { selectFolders } from '../../../../../store/folders-slice';
import ContactNames from './contact-names';
import { MailMessage, TextReadValuesProps } from '../../../../../types';
import { useAppSelector } from '../../../../../hooks/redux';

const MessageContactList: FC<{ message: MailMessage; folderId: string }> = ({
	message,
	folderId
}): ReactElement => {
	const [open, setOpen] = useState(false);

	const toggleOpen = useCallback((e) => {
		e.preventDefault();
		setOpen((o) => !o);
	}, []);
	const folders = useAppSelector(selectFolders);

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

	const textReadValues: TextReadValuesProps = useMemo(() => {
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
	const labelTo = useMemo(() => `${t('label.to', 'To')}: `, []);
	const labelCc = useMemo(() => `${t('label.cc', 'CC')}: `, []);
	const labelBcc = useMemo(() => `${t('label.bcc', 'BCC')}: `, []);

	const showBadge = useMemo(
		() => messageFolder?.name && messageFolder.id !== folderId,
		[folderId, messageFolder]
	);
	const [isOverflow, setIsOverflow] = useState(false);
	const showMoreCB = useCallback((showMore) => {
		setIsOverflow(showMore);
	}, []);

	const toggleExpandButtonLabel = useMemo(
		() =>
			open
				? t('label.collapse_receivers_list', "Collapse receiver's list")
				: t('label.expand_receivers_list', "Expand receiver's list"),
		[open]
	);

	const containerRef = useRef<HTMLDivElement>(null);
	const [badgeWidth, setBadgeWidth] = useState('100%');
	useLayoutEffect(() => {
		if (containerRef?.current?.clientWidth) {
			setBadgeWidth(`calc(100% - ${containerRef.current.clientWidth + 25}px)`);
		}
	}, []);
	return (
		<Container
			crossAlignment="flex-start"
			orientation="horizontal"
			width="100%"
			mainAlignment="flex-start"
			padding={{ bottom: 'small' }}
		>
			<Container
				style={{ width: '1.5625rem', padding: '0 0.5rem 0 0' }}
				crossAlignment="baseline"
				mainAlignment="space-between"
				orientation="horizontal"
			>
				{isOverflow && (
					<Tooltip label={toggleExpandButtonLabel}>
						<IconButton
							size="small"
							icon={open ? 'ChevronUp' : 'ChevronDown'}
							onClick={toggleOpen}
							customSize={{
								iconSize: 'small',
								paddingSize: ''
							}}
						/>
					</Tooltip>
				)}
			</Container>
			<Container mainAlignment="flex-start" crossAlignment="flex-start" width={badgeWidth}>
				{!open && (
					<Container width="calc(100% - 1.5rem)" crossAlignment="flex-start">
						<Row height="fit" crossAlignment="flex-start" mainAlignment="flex-start">
							{toContacts.length > 0 && (
								<ContactNames
									showMoreCB={showMoreCB}
									showOverflow
									contacts={toContacts}
									label={labelTo}
								/>
							)}
						</Row>
						<Row height="fit" crossAlignment="flex-start" mainAlignment="flex-start">
							{ccContacts.length > 0 && (
								<ContactNames
									showMoreCB={showMoreCB}
									showOverflow
									contacts={ccContacts}
									label={labelCc}
								/>
							)}
						</Row>
						<Row height="fit" width="100%" crossAlignment="flex-start" mainAlignment="flex-start">
							{bccContacts.length > 0 && (
								<ContactNames
									showMoreCB={showMoreCB}
									showOverflow
									contacts={bccContacts}
									label={labelBcc}
								/>
							)}
						</Row>
					</Container>
				)}
				{open && (
					<Container width="calc(100% - 1.5rem)" crossAlignment="flex-start">
						<Container width="100%">
							<Row height="fit" width="100%" crossAlignment="flex-start" mainAlignment="flex-start">
								{toContacts.length > 0 && <ContactNames contacts={toContacts} label={labelTo} />}
							</Row>
							<Row height="fit" width="100%" crossAlignment="flex-start" mainAlignment="flex-start">
								{ccContacts.length > 0 && <ContactNames contacts={ccContacts} label={labelCc} />}
							</Row>
							<Row height="fit" width="100%" crossAlignment="flex-start" mainAlignment="flex-start">
								{bccContacts.length > 0 && <ContactNames contacts={bccContacts} label={labelBcc} />}
							</Row>
						</Container>
					</Container>
				)}
			</Container>
			<Container ref={containerRef} width="fit" mainAlignment="flex-start">
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
			</Container>
		</Container>
	);
};

export default MessageContactList;
