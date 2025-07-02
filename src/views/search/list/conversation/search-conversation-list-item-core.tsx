/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import {
	Badge,
	Button,
	Container,
	Icon,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { Tag, useTags, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';
import { filter, forEach, includes, isEmpty, reduce, uniqBy } from 'lodash';
import { useTranslation } from 'react-i18next';

import { API_REQUEST_STATUS } from 'constants/index';
import { searchConvEmailStoreAction } from 'store/emails/actions/search-conv-action';
import { NormalizedConversation, SearchRequestStatus, TextReadValuesProps } from 'types/index.d';
import { ItemAvatar } from 'views/app/folder-panel/parts/item-avatar';
import { ParticipantsName } from 'views/app/folder-panel/parts/participants-name';
import { RowInfo } from 'views/app/folder-panel/parts/row-info';

type SearchConversationListItemCoreProps = {
	conversation: NormalizedConversation;
	selected: boolean;
	selecting: boolean;
	toggle: (id: string) => void;
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
	conversationStatus: SearchRequestStatus;
	parent: string;
};
export const SearchConversationListItemCore = ({
	conversation,
	selected,
	selecting,
	toggle,
	conversationStatus,
	open,
	setOpen,
	parent
}: SearchConversationListItemCoreProps): React.JSX.Element => {
	const [t] = useTranslation();

	const tagsFromStore = useTags();
	const tags = useMemo(
		() =>
			uniqBy(
				reduce(
					tagsFromStore,
					(acc: Array<Tag>, v) => {
						if (includes(conversation.tags, v.id)) {
							acc.push({
								...v,
								// casting type to avoid tsignore
								color: ZIMBRA_STANDARD_COLORS[v.color ?? 0].hex as unknown as number
							});
						} else if (conversation.tags?.length > 0 && !includes(conversation.tags, v.id)) {
							forEach(
								filter(conversation.tags, (tn) => tn.includes('nil:')),
								(tagNotInList) => {
									acc.push({
										id: tagNotInList,
										name: tagNotInList.split(':')[1],
										color: 1
									});
								}
							);
						}
						return acc;
					},
					[]
				),
				'id'
			),
		[conversation.tags, tagsFromStore]
	);

	const conversationId = conversation.id;
	const expandConversation = useCallback(
		(e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent | MouseEvent | KeyboardEvent) => {
			e.preventDefault();
			setOpen((currentlyOpen) => {
				if (
					!currentlyOpen &&
					conversationStatus !== API_REQUEST_STATUS.fulfilled &&
					conversationStatus !== API_REQUEST_STATUS.pending
				) {
					searchConvEmailStoreAction(conversationId);
				}
				return !currentlyOpen;
			});
		},
		[conversationId, conversationStatus, setOpen]
	);

	const toggleExpandButtonLabel = useMemo(
		() => (open ? t('label.hide', 'Hide') : t('label.expand', 'Expand')),
		[open, t]
	);
	const subject = useMemo(
		() => conversation.subject || t('label.no_subject_with_tags', '<No Subject>'),
		[conversation.subject, t]
	);
	const subFragmentTooltipLabel = useMemo(
		() => (!isEmpty(conversation.fragment) ? conversation.fragment : subject),
		[subject, conversation.fragment]
	);

	const badgeTotalConversationMessages = useCallback(
		(): number => conversation.messagesInConversation,
		[conversation]
	);

	const textReadValues: TextReadValuesProps = useMemo(() => {
		if (typeof conversation.read === 'undefined')
			return { color: 'text', weight: 'regular', badge: 'read' };
		return conversation.read
			? { color: 'text', weight: 'regular', badge: 'read' }
			: { color: 'primary', weight: 'bold', badge: 'unread' };
	}, [conversation.read]);

	const renderBadge = useMemo(() => {
		if (conversation.messagesInConversation === 1 || conversation?.messageIds?.length === 1) {
			return textReadValues.badge === 'unread';
		}
		return conversation.messagesInConversation > 0 || conversation?.messageIds?.length > 0;
	}, [conversation?.messageIds?.length, conversation.messagesInConversation, textReadValues.badge]);

	const avatarFolderId = conversation.messageIds.length === 1 ? parent : '';

	return (
		<Container mainAlignment="flex-start" orientation="horizontal" height={'4rem'}>
			<div
				style={{ alignSelf: 'center' }}
				data-testid={`conversation-list-item-avatar-${conversationId}`}
			>
				<ItemAvatar
					item={conversation}
					selected={selected}
					selecting={selecting}
					toggle={toggle}
					folderId={avatarFolderId}
				/>
				<Padding horizontal="extrasmall" />
			</div>
			<Row
				takeAvailableSpace
				orientation="horizontal"
				wrap="wrap"
				padding={{ left: 'small', top: 'small', bottom: 'small', right: 'large' }}
			>
				<Container orientation="horizontal" height="fit" width="fill">
					<ParticipantsName item={conversation} textValues={textReadValues} />
					<RowInfo item={conversation} tags={tags} />
				</Container>
				<Container orientation="horizontal" height="fit" width="fill" crossAlignment="center">
					{renderBadge && (
						<Row>
							<Padding right="extrasmall">
								<Badge
									data-testid={`conversation-messages-count-${conversationId}`}
									value={badgeTotalConversationMessages()}
									backgroundColor={textReadValues.badge === 'read' ? 'gray2' : 'primary'}
									color={textReadValues.badge === 'read' ? 'gray0' : 'gray6'}
								/>
							</Padding>
						</Row>
					)}

					<Tooltip label={subFragmentTooltipLabel} overflow="break-word" maxWidth="60vw">
						<Row
							wrap="nowrap"
							takeAvailableSpace
							mainAlignment="flex-start"
							crossAlignment="baseline"
						>
							<Text
								data-testid="Subject"
								weight={textReadValues.weight}
								color={conversation.subject ? 'text' : 'secondary'}
							>
								{subject}
							</Text>
						</Row>
					</Tooltip>
					<Row>
						{conversation.urgent && (
							<Icon data-testid="UrgentIcon" icon="ArrowUpward" color="error" />
						)}
						{conversation.messagesInConversation > 1 && (
							<Tooltip label={toggleExpandButtonLabel}>
								<Button
									data-testid="ToggleExpand"
									size="small"
									shape="regular"
									type="default"
									labelColor="text"
									backgroundColor="transparent"
									icon={open ? 'ArrowIosUpward' : 'ArrowIosDownward'}
									onClick={expandConversation}
								/>
							</Tooltip>
						)}
					</Row>
				</Container>
			</Row>
		</Container>
	);
};
