/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, {
	FC,
	ReactElement,
	SyntheticEvent,
	useCallback,
	useMemo,
	useRef,
	useState
} from 'react';

import {
	Container,
	Text,
	Avatar,
	Icon,
	Padding,
	Row,
	Tooltip,
	Chip,
	Dropdown,
	ContainerProps,
	IconButton,
	getColor
} from '@zextras/carbonio-design-system';
import { useTags, useUserAccounts, runSearch, t } from '@zextras/carbonio-shell-ui';
import {
	capitalize,
	every,
	filter,
	find,
	forEach,
	includes,
	isEmpty,
	map,
	reduce,
	uniqBy
} from 'lodash';
import moment from 'moment';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { ContactNameChip } from './contact-names-chips';
import MessageContactsList from './message-contact-list';
import OnBehalfOfDisplayer from './on-behalf-of-displayer';
import { ParticipantRole } from '../../../../../carbonio-ui-commons/constants/participants';
import { ZIMBRA_STANDARD_COLORS } from '../../../../../carbonio-ui-commons/constants/utils';
import { getTimeLabel, participantToString } from '../../../../../commons/utils';
import { getNoIdentityPlaceholder } from '../../../../../helpers/identities';
import { retrieveAttachmentsType } from '../../../../../store/editor-slice-utils';
import type { MailMessage } from '../../../../../types';
import { MailMsgPreviewActions } from '../../../../../ui-actions/mail-message-preview-actions';
import { useTagExist } from '../../../../../ui-actions/tag-actions';

const HoverContainer = styled(Container)<ContainerProps & { isExpanded: boolean }>`
	cursor: pointer;
	border-radius: ${({ isExpanded }): string => (isExpanded ? '0.25rem 0.25rem 0 0' : '0.25rem')};
	&:hover {
		background: ${({ theme, background = 'currentColor' }): string =>
			getColor(`${background}.hover`, theme)};
	}
`;

const TagChip = styled(Chip)`
	margin-left: ${({ theme }): string => theme.sizes.padding.extrasmall};
	padding: 0.0625rem 0.5rem !important;
	margin-bottom: 0.25rem;
`;

type PreviewHeaderProps = {
	compProps: {
		message: MailMessage;
		onClick: (e: SyntheticEvent) => void;
		open: boolean;
		isExternalMessage?: boolean;
		messagePreviewFactory: () => React.JSX.Element;
	};
};

const fallbackContact = {
	type: ParticipantRole.FROM,
	address: '',
	displayName: getNoIdentityPlaceholder(),
	fullName: ''
};

const PreviewHeader: FC<PreviewHeaderProps> = ({ compProps }): ReactElement => {
	const { message, onClick, open, isExternalMessage, messagePreviewFactory } = compProps;

	const textRef = useRef<HTMLInputElement>(null);
	const accounts = useUserAccounts();

	const [isContactListExpand, setIsContactListExpand] = useState(false);
	const mainContact = find(message.participants, ['type', 'f']) || fallbackContact;
	const _onClick = useCallback((e) => !e.isDefaultPrevented() && onClick(e), [onClick]);
	const attachments = retrieveAttachmentsType(message, 'attachment');
	const senderContact = find(message.participants, ['type', 's']);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const { folderId } = useParams();

	const contactListExpandCB = useCallback((contactListExpand) => {
		setIsContactListExpand(contactListExpand);
	}, []);

	const tagsFromStore = useTags();
	const tags = useMemo(
		() =>
			reduce(
				tagsFromStore,
				(acc: any, v) => {
					if (includes(message.tags, v.id)) {
						acc.push({
							...v,
							// TODO: align the use of the property with the type exposed by the shell
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							color: ZIMBRA_STANDARD_COLORS[v.color ?? 0].hex,
							label: v.name,
							customComponent: (
								<Row takeAvailableSpace mainAlignment="flex-start">
									<Row takeAvailableSpace mainAlignment="space-between">
										<Row mainAlignment="flex-end">
											<Padding right="small">
												<Icon icon="Tag" color={ZIMBRA_STANDARD_COLORS[v.color ?? 0].hex} />
											</Padding>
										</Row>
										<Row takeAvailableSpace mainAlignment="flex-start">
											<Text>{v.name}</Text>
										</Row>
									</Row>
								</Row>
							)
						});
					} else if (message.tags?.length > 0 && !includes(message.tags, v.id)) {
						forEach(
							filter(message.tags, (tn) => tn?.includes('nil:')),
							(tagNotInList) => {
								acc.push({
									id: tagNotInList,
									name: tagNotInList.split(':')[1],
									label: t('label.not_in_list', {
										name: tagNotInList.split(':')[1],
										defaultValue: '{{name}} - Not in your tag list'
									}),
									color: ZIMBRA_STANDARD_COLORS[0].hex,
									customComponent: (
										<Row takeAvailableSpace mainAlignment="flex-start">
											<Row takeAvailableSpace mainAlignment="space-between">
												<Row mainAlignment="flex-end">
													<Padding right="small">
														<Icon icon="Tag" color={ZIMBRA_STANDARD_COLORS[0].hex} />
													</Padding>
												</Row>
												<Row takeAvailableSpace mainAlignment="flex-start">
													<Text>
														{t('label.not_in_list', {
															name: tagNotInList.split(':')[1],
															defaultValue: '{{name}} - Not in your tag list'
														})}
													</Text>
												</Row>
											</Row>
										</Row>
									)
								});
							}
						);
					}
					return uniqBy(acc, 'id');
				},
				[]
			),
		[message.tags, tagsFromStore]
	);

	const tagIcon = useMemo(() => (tags.length > 1 ? 'TagsMoreOutline' : 'Tag'), [tags]);
	const tagIconColor = useMemo(() => (tags?.length === 1 ? tags[0].color : undefined), [tags]);

	const tagLabel = useMemo(() => t('label.tags', 'Tags'), []);

	const [showDropdown, setShowDropdown] = useState(false);
	const onIconClick = useCallback((ev: { stopPropagation: () => void }): void => {
		ev.stopPropagation();
		setShowDropdown((o) => !o);
	}, []);

	const onDropdownClose = useCallback((): void => {
		setShowDropdown(false);
	}, []);

	const isTagInStore = useTagExist(tags);

	const showMultiTagIcon = useMemo(() => message.tags?.length > 1, [message]);
	const showTagIcon = useMemo(
		() =>
			message.tags &&
			message.tags?.length !== 0 &&
			!showMultiTagIcon &&
			isTagInStore &&
			every(message.tags, (tn) => tn !== ''),
		[isTagInStore, message.tags, showMultiTagIcon]
	);
	const triggerSearch = useCallback(
		(tagToSearch) =>
			runSearch(
				[
					{
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						avatarBackground: tagToSearch?.color || 0,
						avatarIcon: 'Tag',
						background: 'gray2',
						hasAvatar: true,
						// TODO: fix type definition
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						isGeneric: false,
						isQueryFilter: true,
						label: `tag:${tagToSearch?.name}`,
						value: `tag:"${tagToSearch?.name}"`
					}
				],
				'mails'
			),
		[]
	);
	const scheduledTime = useMemo(
		() =>
			t('message.schedule_mail', {
				date: moment(message?.autoSendTime).format('DD/MM/YYYY'),
				time: moment(message?.autoSendTime).format('HH:mm'),
				defaultValue: 'Will be sent on: {{date}} at {{time}}'
			}),
		[message?.autoSendTime]
	);

	return (
		<HoverContainer
			height="fit"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			background="gray6"
			isExpanded={open}
			data-testid={`open-message-${message.id}`}
			onClick={_onClick}
		>
			<Container height="fit" width="100%">
				<Container orientation="horizontal">
					<Container
						orientation="vertical"
						width="fit"
						mainAlignment="flex-start"
						padding={{ all: 'small' }}
					>
						<Avatar
							label={mainContact.fullName || mainContact.address || getNoIdentityPlaceholder()}
							colorLabel={mainContact.address || getNoIdentityPlaceholder()}
							size="small"
						/>
					</Container>
					<Row
						height="fit"
						width="calc(100% - 3rem)"
						padding={{ vertical: 'small' }}
						takeAvailableSpace
					>
						<Container orientation="horizontal" mainAlignment="space-between" width="fill">
							<Row
								// this style replace takeAvailableSpace prop, it calculates growth depending from content (all 4 props are needed)
								style={{
									flexGrow: 1,
									flexBasis: 'fit-content',
									overflow: 'hidden',
									whiteSpace: 'nowrap'
								}}
								mainAlignment="flex-start"
								wrap="nowrap"
							>
								{isEmpty(senderContact) ? (
									<Row takeAvailableSpace width="fit" mainAlignment="flex-start" wrap="nowrap">
										<Text
											data-testid="SenderText"
											size={message.read ? 'small' : 'medium'}
											color={message.read ? 'text' : 'primary'}
											weight={message.read ? 'regular' : 'bold'}
										>
											{capitalize(participantToString(mainContact, accounts))}
										</Text>
										<Row
											takeAvailableSpace
											width="fit"
											mainAlignment="flex-start"
											wrap="nowrap"
											padding={{ left: 'small' }}
										>
											{!isContactListExpand && (
												<Text color="gray1" size={message.read ? 'small' : 'medium'}>
													{mainContact.address && mainContact.address}
												</Text>
											)}
											{isContactListExpand && mainContact.address && (
												<ContactNameChip contacts={[mainContact]} label={''} />
											)}
										</Row>
									</Row>
								) : (
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									<OnBehalfOfDisplayer compProps={{ senderContact, message, mainContact }} />
								)}
							</Row>

							{!isExternalMessage && (
								<Row
									wrap="nowrap"
									mainAlignment="flex-end"
									// this style replace takeAvailableSpace prop, it calculates growth depending from content (all 4 props are needed)
									style={{
										flexGrow: 1,
										flexBasis: 'fit-content',
										whiteSpace: 'nowrap',
										overflow: 'hidden'
									}}
								>
									{showTagIcon && (
										<Padding left="small">
											<Tooltip label={message?.tags?.[0]} disabled={showMultiTagIcon}>
												<Icon data-testid="TagIcon" icon={tagIcon} color={`${tagIconColor}`} />
											</Tooltip>
										</Padding>
									)}
									{showMultiTagIcon && (
										<Dropdown items={tags} forceOpen={showDropdown} onClose={onDropdownClose}>
											<Padding left="small">
												<IconButton data-testid="TagIcon" icon={tagIcon} onClick={onIconClick} />
											</Padding>
										</Dropdown>
									)}
									{message.hasAttachment && attachments.length > 0 && (
										<Padding left="small">
											<Icon icon="AttachOutline" />
										</Padding>
									)}
									{message.flagged && (
										<Padding left="small">
											<Icon color="error" icon="Flag" data-testid="FlagIcon" />
										</Padding>
									)}
									<Row ref={textRef} minWidth="fit" padding={{ horizontal: 'small' }}>
										{message?.isScheduled ? (
											<Text color="primary" data-testid="scheduledLabel" size="small">
												{scheduledTime}
											</Text>
										) : (
											<Text color="gray1" data-testid="DateLabel" size="extrasmall">
												{getTimeLabel(message.date)}
											</Text>
										)}
									</Row>

									{open && message && (
										<MailMsgPreviewActions
											message={message}
											messagePreviewFactory={messagePreviewFactory}
										/>
									)}
								</Row>
							)}
						</Container>
					</Row>
				</Container>
				{!isExternalMessage && tags?.length > 0 && open && (
					<Container
						orientation="horizontal"
						crossAlignment="flex-start"
						mainAlignment="flex-start"
						padding={{ left: 'large' }}
					>
						<Padding left="extrasmall">
							<Text color="secondary" size="small" overflow="break-word">
								{tagLabel}:
								{map(tags, (tag) => (
									<TagChip
										label={tag?.label}
										avatarBackground={tag.color}
										background="gray2"
										hasAvatar
										avatarIcon="Tag"
										onClick={(): void => triggerSearch(tag)}
									/>
								))}
							</Text>
						</Padding>
					</Container>
				)}
			</Container>
			<Container
				orientation="horizontal"
				padding={{ horizontal: 'small' }}
				mainAlignment="flex-start"
			>
				{!open && (
					<Row padding={{ bottom: 'small' }}>
						<Text color="secondary" size="small">
							{message.fragment}
						</Text>
					</Row>
				)}
				{open && (
					<MessageContactsList
						message={message}
						folderId={folderId}
						contactListExpandCB={contactListExpandCB}
					/>
				)}
			</Container>
		</HoverContainer>
	);
};

export default PreviewHeader;
