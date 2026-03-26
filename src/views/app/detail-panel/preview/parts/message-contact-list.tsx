/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, {
	FC,
	memo,
	ReactElement,
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState
} from 'react';

import {
	Button,
	Container,
	Icon,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { useFoldersMap } from '@zextras/carbonio-ui-commons';
import { filter, find } from 'lodash';

import { isFocusModeMailView } from '../../../../../helpers/external-tabs';
import { ItemBadge } from '../../../folder-panel/parts/item-badge';
import { MailMessage } from 'types/messages';
import ContactNames from 'views/app/detail-panel/preview/parts/contact-names';
import { ContactNameChip } from 'views/app/detail-panel/preview/parts/contact-names-chips';
import { getFolderTranslatedName } from 'views/sidebar/utils';

const EmptyToField: FC<{ labelTo: string }> = memo(({ labelTo }) => (
	<Row mainAlignment="flex-start">
		<Text color="secondary" size="small" style={{ paddingRight: '0.25rem' }}>
			{labelTo} {t('recipient.toField.missing', `[Empty 'To' Field]`)}
		</Text>
	</Row>
));
EmptyToField.displayName = 'EmptyToField';

const MessageContactList: FC<{
	message: MailMessage;
	folderId?: string;
	contactListExpandCB: (showMore: boolean) => void;
	isWide: boolean;
}> = ({ message, folderId, contactListExpandCB, isWide }): ReactElement => {
	const [open, setOpen] = useState(false);

	const toggleOpen = useCallback(
		(e: React.MouseEvent | MouseEvent | KeyboardEvent) => {
			e.preventDefault();
			setOpen((o) => {
				contactListExpandCB(!o);
				return !o;
			});
		},
		[contactListExpandCB]
	);
	const folders = useFoldersMap();

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

	const messageFolder = useMemo(
		() => find(folders, (folder) => folder.id === message.parent),
		[folders, message.parent]
	);

	const labelTo = useMemo(() => `${t('label.to', 'To')}: `, []);
	const labelCc = useMemo(() => `${t('label.cc', 'CC')}: `, []);
	const labelBcc = useMemo(() => `${t('label.bcc', 'BCC')}: `, []);

	const showBadge = useMemo(
		() => !!messageFolder?.name && (messageFolder?.id !== folderId || isFocusModeMailView()),
		[folderId, messageFolder]
	);

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
				minWidth="1.5625rem"
				width="1.5625rem"
				crossAlignment="baseline"
				mainAlignment="space-between"
				orientation="horizontal"
			>
				<Tooltip label={toggleExpandButtonLabel}>
					<Button
						size={'small'}
						type={'ghost'}
						color={'gray0'}
						icon={open ? 'ChevronUp' : 'ChevronDown'}
						onClick={toggleOpen}
						data-testid="contacs-list-toggle-icon"
					/>
				</Tooltip>
			</Container>
			<Container mainAlignment="flex-start" crossAlignment="flex-start" width={badgeWidth}>
				{!open && (
					<Container width="calc(100% - 1.5rem)" crossAlignment="flex-start">
						<Row
							height="fit"
							crossAlignment="flex-start"
							mainAlignment="flex-start"
							data-testid="ContactNamesToRow"
						>
							{toContacts.length > 0 ? (
								<ContactNames showOverflow contacts={toContacts} label={labelTo} />
							) : (
								<EmptyToField labelTo={labelTo} />
							)}
						</Row>
						<Row
							height="fit"
							crossAlignment="flex-start"
							mainAlignment="flex-start"
							data-testid="ContactNamesCcRow"
						>
							{ccContacts.length > 0 && (
								<ContactNames showOverflow contacts={ccContacts} label={labelCc} />
							)}
						</Row>
						<Row
							height="fit"
							width="100%"
							crossAlignment="flex-start"
							mainAlignment="flex-start"
							data-testid="ContactNamesBccRow"
						>
							{bccContacts.length > 0 && (
								<ContactNames showOverflow contacts={bccContacts} label={labelBcc} />
							)}
						</Row>
					</Container>
				)}
				{open && (
					<Container width="calc(100% - 1.5rem)" crossAlignment="flex-start">
						<Container width="100%">
							<Row
								height="fit"
								width="100%"
								crossAlignment="flex-start"
								mainAlignment="flex-start"
								padding={{ bottom: 'small' }}
							>
								{toContacts.length > 0 ? (
									<ContactNameChip contacts={toContacts} label={labelTo} isWide={isWide} />
								) : (
									<EmptyToField labelTo={labelTo} />
								)}
							</Row>
							{ccContacts.length > 0 && (
								<Row
									height="fit"
									width="100%"
									crossAlignment="flex-start"
									mainAlignment="flex-start"
									padding={{ bottom: 'small' }}
								>
									<ContactNameChip contacts={ccContacts} label={labelCc} isWide={isWide} />
								</Row>
							)}
							<Row height="fit" width="100%" crossAlignment="flex-start" mainAlignment="flex-start">
								{bccContacts.length > 0 && (
									<ContactNameChip contacts={bccContacts} label={labelBcc} isWide={isWide} />
								)}
							</Row>
						</Container>
					</Container>
				)}
			</Container>
			<Container ref={containerRef} width="fit" mainAlignment="flex-start">
				{message.urgent && <Icon data-testid="UrgentIcon" color="error" icon="ArrowUpward" />}
				{showBadge && messageFolder?.name && (
					<Padding left="small">
						<ItemBadge
							itemReadValue={message.read}
							value={getFolderTranslatedName({
								folderId,
								folderName: messageFolder.name
							})}
						/>
					</Padding>
				)}
			</Container>
		</Container>
	);
};

export default MessageContactList;
