/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useState, useEffect, useCallback, FC, ReactElement } from 'react';
import {
	Container,
	FormSubSection,
	Select,
	Text,
	Input,
	List,
	Row,
	Button,
	Padding,
	SelectItem
} from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import { t, useIntegratedComponent, useUserAccount } from '@zextras/carbonio-shell-ui';
import { map, find, findIndex, merge, escape, unescape } from 'lodash';
import { getSignature, getSignatures } from '../../helpers/signatures';
import { SignatureDescriptor } from '../../types/signatures';
import Heading from './components/settings-heading';
import { GetAllSignatures } from '../../store/actions/signatures';
import { signaturesSubSection, setDefaultSignaturesSubSection } from './subsections';
import { SignatureSettingsPropsType, SignItemType } from '../../types';

const Signature = styled(Row)`
	border-bottom: 0.0625rem solid ${({ theme }): string => theme.palette.gray2.regular};
	display: block;
	border-radius: 0;
	cursor: pointer;
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray6.focus};
	}
`;
const EditorWrapper = styled.div`
	width: 100%;
	height: 100%;
	overflow-y: auto;
	position: relative;
`;

const SignatureSettings: FC<SignatureSettingsPropsType> = ({
	settingsObj,
	updateSettings,
	setDisabled,
	signItems,
	setSignItems,
	setSignItemsUpdated
}): ReactElement => {
	const account = useUserAccount();
	const [signatures, setSignatures] = useState(getSignatures(account));
	const [signs, setSigns] = useState([]);
	const [selected, setSelected] = useState({});

	const [id, setId] = useState('');
	const [name, setName] = useState<string | undefined>('');
	const [description, setDescription] = useState<string | undefined>('');
	const [index, setIndex] = useState<number | undefined>(0);
	const [editorFlag, setEditorFlag] = useState(false);

	useEffect(() => {
		// if (fetchSigns) {
		GetAllSignatures().then((res) => {
			setSigns(res.signature);
			// setFetchSigns(false);
		});
		// }
	}, []);

	setSignItemsUpdated(
		useMemo(
			() =>
				map(signs, (item: SignItemType, idx) => ({
					label: item.name,
					id: item.id,
					description: item?.content?.[0]?._content,
					index: idx
				})),
			[signs]
		)
	);

	setSignItems(
		useMemo(() => {
			const signItem = map(signs, (item: SignItemType, idx) => ({
				label: item.name,
				id: item.id,
				description: item?.content?.[0]?._content,
				index: idx
			}));
			if (signItem?.length) {
				setId(signItem[0].id);
				setIndex(0);
				setName(signItem?.[0]?.label);
				setDescription(signItem?.[0]?.description);
			}
			return signItem;
		}, [signs])
	);

	const createSign = (): void => {
		setName('');
		setDescription('');
		setId('');
		setIndex(signItems?.length);
		const updatedSign = signItems;
		updatedSign.push({
			id: (Math.random() + 1).toString(36).substring(7),
			description: '',
			label: t('label.enter_name', 'Enter Name'),
			index: signItems.length
		});
		setSignItems(updatedSign);
	};

	const [signatureNewMessage, signatureRepliesForwards] = useMemo(
		() => [
			getSignature(account, settingsObj.zimbraPrefDefaultSignatureId, true),
			getSignature(account, String(settingsObj.zimbraPrefForwardReplySignatureId), true)
		],
		[
			account,
			settingsObj.zimbraPrefDefaultSignatureId,
			settingsObj.zimbraPrefForwardReplySignatureId
		]
	);

	const updateAllSignatures = (updatedSign: SignItemType[]): void => {
		const allSignatures = updatedSign.map(
			(item) =>
				({
					label: item.label ?? '',
					value: {
						description: unescape(item.description),
						id: item.id
					}
				} as SignatureDescriptor)
		);
		setSignatures(allSignatures);
	};

	const ListItem = ({ item }: { item: SignItemType }): ReactElement => {
		const [hovered, setHovered] = useState(false);
		const onMouseEnter = useCallback(() => setHovered(true), []);
		const onMouseLeave = useCallback(() => setHovered(false), []);

		const onDelete = (): void => {
			const updatedSign = signItems;
			const deleteIndex = findIndex(updatedSign, { label: item.label });
			updatedSign.splice(deleteIndex, 1);
			map(signItems, (ele, i) => {
				merge(updatedSign[i], { index: i });
			});
			if (updatedSign?.length) {
				setIndex(0);
				setName(`${updatedSign[0].label}`);
				setDescription(updatedSign[0].description);
				setId(updatedSign[0].id);
				setSelected({ [updatedSign[0].id]: true });
			} else {
				setIndex(-1);
				setName('');
				setDescription('');
				setId('');
			}
			setSignItems(updatedSign);
		};

		return (
			<Signature
				height="fit"
				orientation="horizontal"
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				background={index === item.index ? 'highlight' : ''}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				onClick={(ev: React.MouseEvent & { target: { innerText: string } }): void => {
					if (ev.target.innerText === 'DELETE') {
						ev.preventDefault();
					} else {
						setId(item.id);
						setName(item.label);
						setDescription(item.description);
						setIndex(item?.index);
					}
				}}
			>
				<Row height="2.5rem" padding={{ all: 'small' }}>
					<Container width="60%" crossAlignment="flex-start">
						<Text weight="bold">{item.label}</Text>
					</Container>

					<Container width="40%" orientation="horizontal" mainAlignment="flex-end">
						{hovered && (
							<Button
								label={t('label.delete', 'Delete')}
								type="outlined"
								color="error"
								onClick={(): void => onDelete()}
							/>
						)}
					</Container>
				</Row>
			</Signature>
		);
	};
	const [Composer, composerIsAvailable] = useIntegratedComponent('composer');
	const sectionTitleSignatures = useMemo(() => signaturesSubSection(), []);
	const sectionTitleSetSignatures = useMemo(() => setDefaultSignaturesSubSection(), []);
	return (
		<>
			<FormSubSection
				label={sectionTitleSignatures.label}
				id={sectionTitleSignatures.id}
				padding={{ all: 'large' }}
			>
				<Container crossAlignment="flex-start" orientation="horizontal" padding={{ all: 'medium' }}>
					<Container width="25%" padding={{ right: 'medium' }}>
						<Container mainAlignment="flex-start">
							<Container>
								<Button
									label={t('signatures.add_signature', 'Add signature')}
									type="outlined"
									onClick={createSign}
									disabled={signItems?.length > 0 && !name}
								/>
							</Container>
							<Padding all="small" />

							<Container height="31.25rem">
								<List items={signItems ?? []} ItemComponent={ListItem} selected={selected} />
							</Container>
						</Container>
					</Container>
					<Container width="75%" mainAlignment="flex-start">
						<Container orientation="vertical" mainAlignment="space-around" width="100%">
							<Input
								label={t('signatures.name', 'Name')}
								value={name}
								backgroundColor="gray5"
								onChange={(ev: React.ChangeEvent<HTMLInputElement>): void => {
									setName(ev.target.value);
									const updatedSign = signItems;
									if (index) updatedSign[index].label = ev.target.value;
									setDisabled(false);
									setSignItems(updatedSign);
									updateAllSignatures(updatedSign);
								}}
							/>
						</Container>
						<Padding all="small" />
						{composerIsAvailable && (
							<EditorWrapper>
								<Composer
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									value={unescape(description)}
									onEditorChange={(ev: [string, string]): void => {
										const updatedSign = signItems;
										if (index && index >= 0 && updatedSign[index].description !== ev[1]) {
											updatedSign[index].description = escape(ev[1]);
											if (editorFlag) {
												setDisabled(false);
											}
											setEditorFlag(true);
											setSignItems(updatedSign);
											updateAllSignatures(updatedSign);
										}
									}}
								/>
							</EditorWrapper>
						)}
					</Container>
				</Container>
			</FormSubSection>
			<FormSubSection label={sectionTitleSetSignatures.label} id={sectionTitleSetSignatures.id}>
				<Container crossAlignment="baseline" padding={{ all: 'small' }}>
					<Heading title={t('title.new_messages', 'New Messages')} />
					<Select
						items={signatures.map((signature) => ({
							label: signature.label,
							value: signature.value.id
						}))}
						label={t('label.select_signature', 'Select a signature')}
						selection={
							{
								label: signatureNewMessage?.label,
								value: signatureNewMessage?.value.id
							} as SelectItem
						}
						onChange={(selectedId: any): void => {
							if (selectedId === signatureNewMessage?.value.id) {
								return;
							}
							updateSettings({
								target: {
									name: 'zimbraPrefDefaultSignatureId',
									value: getSignature(account, selectedId)?.value.id ?? ''
								}
							});
						}}
					/>
					{signatureNewMessage?.value.description && (
						<Container
							crossAlignment="baseline"
							padding={{ all: 'large' }}
							background="gray5"
							dangerouslySetInnerHTML={{ __html: signatureNewMessage.value.description }}
						/>
					)}
				</Container>
				<Container crossAlignment="baseline" padding={{ all: 'small' }}>
					<Heading title={t('title.replies_forwards', 'Replies & Forwards')} />
					<Select
						items={signatures.map((signature) => ({
							label: signature.label,
							value: signature.value.id
						}))}
						label={t('label.select_signature', 'Select a signature')}
						selection={
							{
								label: signatureRepliesForwards?.label,
								value: signatureRepliesForwards?.value.id
							} as SelectItem
						}
						onChange={(selectedId: any): void => {
							if (selectedId === signatureRepliesForwards?.value.id) {
								return;
							}

							updateSettings({
								target: {
									name: 'zimbraPrefForwardReplySignatureId',
									value: getSignature(account, selectedId)?.value.id ?? ''
								}
							});
						}}
					/>
					{signatureRepliesForwards?.value.description && (
						<Container
							crossAlignment="baseline"
							padding={{ all: 'large' }}
							background="gray5"
							dangerouslySetInnerHTML={{ __html: signatureRepliesForwards.value.description }}
						/>
					)}
				</Container>
			</FormSubSection>
		</>
	);
};

export default SignatureSettings;
