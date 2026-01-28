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
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';

import styled from '@emotion/styled';
import {
	Avatar,
	Container,
	Icon,
	Padding,
	Row,
	Text,
	getColor
} from '@zextras/carbonio-design-system';
import { t, useUserAccounts } from '@zextras/carbonio-shell-ui';
import {
	ParticipantRole,
	Tag,
	ZIMBRA_STANDARD_COLORS,
	useSortedTagsArray
} from '@zextras/carbonio-ui-commons';
import { filter, find, forEach, includes, isEmpty, reduce, uniqBy } from 'lodash';
import { useParams } from 'react-router-dom';

import type { DetailPanelRoutesParams } from '../../../../../types/routes';
import { getNoIdentityPlaceholder } from 'helpers/identities';
import type { MailMessage } from 'types/index.d';
import { ContactChip } from 'views/app/detail-panel/preview/parts/contact-names-chips';
import { MailInfoBlock } from 'views/app/detail-panel/preview/parts/info-block/mail-info-block';
import MessageContactsList from 'views/app/detail-panel/preview/parts/message-contact-list';
import OnBehalfOfDisplayer from 'views/app/detail-panel/preview/parts/on-behalf-of-displayer';
import { TagsInExpandedHeader } from './header-tags';
import { PreviewHeaderActions } from './preview-header-actions';
import { participantToString } from 'commons/utils';

const HoverContainer = styled(Container)<{ $isExpanded: boolean }>`
	cursor: pointer;
	border-radius: ${({ $isExpanded }): string => ($isExpanded ? '0.25rem 0.25rem 0 0' : '0.25rem')};
	&:hover {
		background: ${({ theme, background = 'currentColor' }): string =>
			getColor(`${background}.hover`, theme)};
	}
`;

type PreviewHeaderProps = {
	message: MailMessage;
	onClick: (e: SyntheticEvent) => void;
	open: boolean;
	isEml?: boolean;
};

const fallbackContact = {
	type: ParticipantRole.FROM,
	address: '',
	displayName: getNoIdentityPlaceholder(),
	fullName: ''
};

export const useContainerWidth = (
	ref: React.RefObject<HTMLDivElement>,
	threshold: number
): boolean => {
	const [width, setWidth] = useState(0);

	const handleResize = useCallback((entries: ResizeObserverEntry[]): void => {
		setWidth(entries[0].contentRect.width);
	}, []);

	useEffect(() => {
		if (!ref.current) return;

		const observer = new ResizeObserver(handleResize);

		observer.observe(ref.current);

		return (): void => {
			observer?.disconnect();
		};
	}, [ref, handleResize]);

	return width >= threshold;
};

export const PreviewHeader: FC<PreviewHeaderProps> = ({
	message,
	onClick,
	open,
	isEml
}): ReactElement => {
	const containerRef = useRef<HTMLDivElement>(null);
	const accounts = useUserAccounts();
	const { folderId } = useParams<DetailPanelRoutesParams>() as DetailPanelRoutesParams;

	const [isContactListExpand, setIsContactListExpand] = useState(false);
	const isWide = useContainerWidth(containerRef, 720);
	const tagsFromStore = useSortedTagsArray();

	const mainContact = find(message.participants, ['type', 'f']) || fallbackContact;
	const senderContact = find(message.participants, ['type', 's']);

	const _onClick = useCallback(
		(e: React.MouseEvent) => !e.isDefaultPrevented() && onClick(e),
		[onClick]
	);

	const contactListExpandCB = useCallback((contactListExpand: boolean) => {
		setIsContactListExpand(contactListExpand);
	}, []);

	const tags = useMemo(
		() =>
			reduce(
				tagsFromStore,
				(acc: Tag[], v) => {
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
									// TODO: align the use of the property with the type exposed by the shell
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
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

	return (
		<Row width="fill">
			<HoverContainer
				height="fit"
				mainAlignment="flex-start"
				crossAlignment="flex-start"
				background="gray6"
				$isExpanded={open}
				data-testid={`open-message-${message.id}`}
				onClick={_onClick}
			>
				<Container height="fit" width="100%" ref={containerRef}>
					<Container orientation="horizontal">
						<Container
							width="fit"
							height={isContactListExpand && !isWide ? '-webkit-fill-available' : 'fit'}
							mainAlignment={isContactListExpand && !isWide ? 'flex-start' : 'center'}
							padding={{ all: 'small' }}
						>
							<Avatar
								label={mainContact.fullName || mainContact.address || getNoIdentityPlaceholder()}
								colorLabel={mainContact.address || getNoIdentityPlaceholder()}
								size="small"
							/>
						</Container>
						<Row height="fit" minHeight="32px" padding={{ vertical: 'small' }} takeAvailableSpace>
							<Container orientation="horizontal" mainAlignment="space-between" width="fill">
								<Row
									style={{
										overflow: 'hidden'
									}}
									mainAlignment="flex-start"
									wrap="nowrap"
								>
									{isEmpty(senderContact) ? (
										<Row
											takeAvailableSpace
											orientation={isContactListExpand && !isWide ? 'vertical' : 'horizontal'}
											width="fit"
											crossAlignment="flex-start"
											mainAlignment="flex-start"
											wrap="nowrap"
										>
											<Text
												data-testid="SenderText"
												size={message.read ? 'small' : 'medium'}
												color={message.read ? 'text' : 'primary'}
												weight={message.read ? 'regular' : 'bold'}
											>
												{participantToString(mainContact, accounts)}
											</Text>
											{!isContactListExpand && (
												<Row
													takeAvailableSpace
													width="fit"
													mainAlignment="flex-start"
													wrap="nowrap"
													padding={{ left: 'small' }}
												>
													<Text color="gray1" size={message.read ? 'small' : 'medium'}>
														{mainContact.address}
													</Text>
												</Row>
											)}
											{isContactListExpand &&
												mainContact.address &&
												(isWide ? (
													<>
														<Padding left="small" />
														<ContactChip contact={mainContact} isExpanded={true} />
													</>
												) : (
													<Row takeAvailableSpace mainAlignment="flex-start" wrap="nowrap">
														<ContactChip contact={mainContact} isExpanded={true} />
													</Row>
												))}
										</Row>
									) : (
										<OnBehalfOfDisplayer compProps={{ senderContact, message, mainContact }} />
									)}
								</Row>
								{!isEml && (
									<PreviewHeaderActions message={message} tags={tags} open={open} isWide={isWide} />
								)}
							</Container>
						</Row>
					</Container>
					<TagsInExpandedHeader isEml={isEml} tags={tags} open={open} isWide={isWide} />
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
							isWide={isWide}
						/>
					)}
				</Container>
				<MailInfoBlock msg={message} />
			</HoverContainer>
		</Row>
	);
};
