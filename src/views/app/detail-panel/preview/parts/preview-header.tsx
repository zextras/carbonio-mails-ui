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
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	useEffect
} from 'react';

import * as pvutils from "pvutils";
import * as pkijs from 'pkijs';
import parse from "emailjs-mime-parser";

import {
	Container,
	Text,
	Avatar,
	Icon,
	Padding,
	Row,
	ThemeContext,
	Tooltip,
	Chip,
	Dropdown,
	ContainerProps,
	IconButton,
	Button,
	getColor,
	Modal
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
import type { MailMessage, MessageAction } from '../../../../../types';
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
		isInsideExtraWindow?: boolean;
	};
	actions: MessageAction[];
};


type SignatureInfo = {
	signedBy: String;
	issuer: String;
	validity: String;

}
const fallbackContact = {
	type: ParticipantRole.FROM,
	address: '',
	displayName: getNoIdentityPlaceholder(),
	fullName: ''
};

const PreviewHeader: FC<PreviewHeaderProps> = ({ compProps, actions }): ReactElement => {
	const { message, onClick, open, isExternalMessage } = compProps;
	

	const textRef = useRef<HTMLInputElement>(null);
	const accounts = useUserAccounts();

	const [_minWidth, _setMinWidth] = useState('');
	const [isContactListExpand, setIsContactListExpand] = useState(false);
	const mainContact = find(message.participants, ['type', 'f']) || fallbackContact;
	const _onClick = useCallback((e) => !e.isDefaultPrevented() && onClick(e), [onClick]);
	const attachments = retrieveAttachmentsType(message, 'attachment');
	const senderContact = find(message.participants, ['type', 's']);
	const [signed, setSigned] = useState(false);
	const trustedCAs = ["MIIF9zCCA9+gAwIBAgIBATANBgkqhkiG9w0BAQsFADBfMQswCQYDVQQGEwJJVDEQ\nMA4GA1UECAwHVmljZW56YTEQMA4GA1UEBwwHVmljZW56YTEQMA4GA1UECgwHemV4\ndHJhczEaMBgGA1UEAwwRKi5kZW1vLnpleHRyYXMuaW8wHhcNMjQwODA4MTQ1NjU5\nWhcNMzQwODA2MTQ1NjU5WjCBhzELMAkGA1UEBhMCSVQxEDAOBgNVBAgMB1ZpY2Vu\nemExEDAOBgNVBAcMB1ZpY2VuemExEDAOBgNVBAoMB3pleHRyYXMxGjAYBgNVBAMM\nESouZGVtby56ZXh0cmFzLmlvMSYwJAYJKoZIhvcNAQkBFhd6ZXh0cmFzQGRlbW8u\nemV4dHJhcy5pbzCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAKr0Inq1\nRMUp8eX0kFSLipzqkXWfYZ4Ehc9KPu8+K4QC/7QsEJVZzitG5hSP5y86uIW8fcz1\ngN4Y1//5J381C6mSHfhs8BN66AN/Kszt55keSAmdYxYg7ejQYX8aeaaD40XIU+4Y\n4BVKyfPtHAhRgSC4BOGOvn8C+z4x9YmRsbKNOZPT3agFmXP868juUoqITcL73TAT\nJ9WIpkYkmmQW6rlxvGM2qQP4e4Ak+nprx8siNRTISAX8XtOsay8gHW2C7jK/Po+V\n0wFyoHBfybPEblJwUEiwxprA8wdUb4UrcWnO7Z/QlKsxrjeUGUwJjfDlwHTHz04+\nmkFNoU/xMXhMiTi7UyuJV5uFcDqHpOnJeWuP2VOysfaelGm8Y+WMg97YZMRAPsgN\nfFAysw+qKz3rbJa1Mf+4+E69fTbOj44dXfuyZ7SRCcWhALftyKh3VRwjgK8ex0hj\nOknkmHvZk2POz06Gig1OEN350xU2tyIrKt9BYj896GVov7cjbIRj/gWf0fmotceY\nBeOYmKK3X5potzlPLTJEWvUcA7ITj4IFYopSXwZRFqgIeLrOA7A9yoeq28z3dTjm\nt3qei6OOsQrcYm8UCDAdbGGj6KUMcdVabDZsvcVT8yBS42yVzjMcVQJv4/ozij+1\nSD99wBWmoeorpEziTZyCxA4QhhE6LbwdI4o7AgMBAAGjgZQwgZEwCQYDVR0TBAIw\nADALBgNVHQ8EBAMCBeAwEwYDVR0lBAwwCgYIKwYBBQUHAwQwHQYDVR0OBBYEFDyX\nbG2juPxZYtiPESQjPb9H3sCZMB8GA1UdIwQYMBaAFExuaK66ywao0yYZfrd3Kwnu\nBzioMCIGA1UdEQQbMBmBF3pleHRyYXNAZGVtby56ZXh0cmFzLmlvMA0GCSqGSIb3\nDQEBCwUAA4ICAQAi51zTNlrXRtpr5juLDs8NQ1xxBOyqG8/qIcZsrqiyZTusu6cr\n+AUObxl98JdRz7JDsXcE0dP5KU0vbJvPXFThT3BfBU24CH7apJW1FbOrefNsq2HV\nRRNlQK8KEsgBr9fejojqP3l3NvPzVKtoYmSUPJNBgU8N84blxFtlqN71pTNd5EJ5\nozix3BzqK4qS7irOX2QX4cRU2OBu67fW51ePklYF8kJx71asuLsCfde6pcd8UAvr\n0rvTPacwtX0KXWAQzU4GKclTlQXAc3IJyQLEc8NcRnaqMfUKu6SO76lYepLGEWNm\nmF10AOADMBNrkjXGACUK3Z8WdbPdV9iVZYlaqSd+eCUsCgE54GXdJZSAF62FnptQ\nIGO2EwyjNZDSu5igtqVAXNN3Hq9pHMsxMPpPnTcWUkr/nlOIUudBjfmJET/K8Lwj\nS4evaZcE2vixXyzPP5Cr5VQWwY4k6B3KiPJh2oCuyfpZrR24yh1JM6khc3apdNE1\nTjvaNZyqy2M0WFOSvizm1oEXuT3SSJyhQpZPaLCFNZfTthbKdpIN9t++PwKPemC6\nVmtiTs0Raes9ZwYeJkLwoMhySIOY9+5g25c60FqK0gUIQYTxoFsJA19guk1dd0qF\nHKiMc+MQwjlnEr+W/xwdp5rprTk7vZWE47qRL+Goai8tg8v/mK2m2aIiAQ==\n"];
	debugger;
	useEffect(() => {
		// Ensure message and message.attachments exist before accessing
		if (message && message.attachments && message.attachments.length > 0) {
		  const lastAttachment = message.attachments[message.attachments.length - 1];
		  const emailSigned = lastAttachment?.contentType === 'application/pkcs7-signature'
		  setSigned(emailSigned);
		  if (emailSigned) {
			const url = 'https://localhost:9000/service/home/~/?auth=co&view=text&id=664';
			fetch(url)
				.then(response => {
				if (!response.ok) {
					throw new Error(`Network response was not ok: ${response.statusText}`);
				}
				return response.text(); // Parse the response as text
				})
				.then(data => {
					const parser = parse(data);
					if (("childNodes" in parser) || (parser.childNodes.length !== 2)) {
						const lastNode = parser.childNodes[1];
						if ((lastNode.contentType.value === "application/x-pkcs7-signature") || (lastNode.contentType.value === "application/pkcs7-signature")) {
						  // Parse into pkijs types
						  let cmsContentSimpl;
						  let cmsSignedSimpl;
					
						  try {
							debugger;
							cmsContentSimpl = pkijs.ContentInfo.fromBER(lastNode.content.buffer);
							cmsSignedSimpl = new pkijs.SignedData({ schema: cmsContentSimpl.content });
							debugger;
						  }
						  catch (ex) {
							alert("Incorrect message format!");
							return;
						  }
					
						  // Get signed data buffer
						  const signedDataBuffer = pvutils.stringToArrayBuffer(parser.childNodes[0].raw);
					
						  // Verify the signed data
							
							cmsSignedSimpl.verify({ signer: 0, data: signedDataBuffer })
							.then(result => {
								debugger;
								console.log(`S/MIME message ${(!result) ? "verification failed" : "successfully verified"}!`);
							}).catch(e => {
								debugger;
								console.error(e);
								console.log("Error during verification. Please see developer console for more details");
							});
							
						 
					
						}
					  }
					  else
						alert("No child nodes!");

				// You can further process the text or store it in state
				})
				.catch(error => {
					console.error('Error fetching text data:', error);
				});
			}
		}
	  }, [message]);


	const [showSmimeDetails, setShowSmimeDetails] = useState(false);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const { folderId } = useParams();

	const contactListExpandCB = useCallback((contactListExpand) => {
		setIsContactListExpand(contactListExpand);
	}, []);

	const theme = useContext(ThemeContext);
	const iconSize = useMemo(
		() => parseInt(theme?.sizes.icon.large, 10),
		[theme?.sizes?.icon?.large]
	);
	useLayoutEffect(() => {
		let width = actions.length > 2 ? iconSize : 2 * iconSize;
		if (message.hasAttachment && attachments.length > 0) width += iconSize;
		if (message.flagged) width += iconSize;
		if (textRef?.current?.clientWidth) width += textRef.current.clientWidth;
		_setMinWidth(`${width}px`);
	}, [
		actions.length,
		attachments.length,
		iconSize,
		message.hasAttachment,
		message.flagged,
		textRef?.current?.clientWidth
	]);

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

	const onSmimeClick = useCallback((ev: { stopPropagation: () => void }): void => {
		ev.stopPropagation();
		setShowDropdown((o) => !o);
		setShowSmimeDetails(true)
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
									minWidth={_minWidth}
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
									

									{open && <MailMsgPreviewActions actions={actions} />}
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
			{signed && (
			<Container
				orientation="horizontal"
				padding={{ horizontal: 'small' }}
				mainAlignment="flex-start"
			>
				<Padding left="small">
					<Button data-testid="TagIcon" icon="Award" onClick={onSmimeClick} 
					color="error"
					label='S/Mime Signed' size='small' type="outlined" iconPlacement="left"/>
				</Padding>
				<Modal open={showSmimeDetails} title={'Sender\'s Digital Signature'} 
					onClose={(): void => setShowSmimeDetails(false)} 
					onConfirm={(): void => { setShowSmimeDetails(false); }} confirmLabel={'OK'} 
					showCloseIcon > 
					<Container
						mainAlignment="flex-start" orientation="vertical" crossAlignment="flex-start">
						<Row><Text>Signed By: dasdas</Text></Row>
						<Row><Text>Issuer: dasdsad</Text></Row>
						<Row><Text>Validity: dasdsadas</Text> </Row>
					</Container>
					
				</Modal>
			</Container>)}
		</HoverContainer>
	);
};

export default PreviewHeader;
