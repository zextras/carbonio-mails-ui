/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
	Container,
	FormSubSection,
	Select,
	Text,
	Input,
	List,
	Row,
	Button,
	Padding
} from '@zextras/carbonio-design-system';
import styled from 'styled-components';

import { useIntegratedComponent, useUserAccount } from '@zextras/carbonio-shell-ui';
import { map, find, findIndex, merge, escape, unescape } from 'lodash';
import Heading from './components/settings-heading';
import { GetAllSignatures } from '../../store/actions/signatures';
import { getSignatures } from '../../store/editor-slice-utils';
import { signaturesSubSection, setDefaultSignaturesSubSection } from './subsections';

const Signature = styled(Row)`
	border-bottom: 1px solid ${({ theme }) => theme.palette.gray2.regular};
	display: block;
	border-radius: 0;
	cursor: pointer;
	&:hover {
		background-color: ${({ theme }) => theme.palette.gray6.focus};
	}
`;
const EditorWrapper = styled.div`
	width: 100%;
	height: 100%;
	overflow-y: auto;
	position: relative;
`;
export default function SignatureSettings({
	t,
	settingsObj,
	updateSettings,
	setDisabled,
	signItems,
	setSignItems,
	/* setFetchSigns,
	fetchSigns, */
	setSignItemsUpdated
}) {
	const account = useUserAccount();
	const [signatures, setSignatures] = useState(getSignatures(account, t));
	const [signs, setSigns] = useState([]);
	const [selected, setSelected] = useState({});

	const [id, setId] = useState('');
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [index, setIndex] = useState();
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
				map(signs, (item, idx) => ({
					label: item.name,
					id: item.id,
					description: item.content[0]._content,
					index: idx
				})),
			[signs]
		)
	);
	setSignItems(
		useMemo(() => {
			const signItem = map(signs, (item, idx) => ({
				label: item.name,
				id: item.id,
				description: item.content[0]._content,
				index: idx
			}));
			if (signItem?.length) {
				setId(signItem[0].id);
				setIndex(0);
				setName(signItem[0].label);
				setDescription(signItem[0].description);
			}
			return signItem;
		}, [signs])
	);

	const createSign = () => {
		setName('');
		setDescription('');
		setId('');
		setIndex(signItems.length);
		const updatedSign = signItems;
		updatedSign.push({
			id: (Math.random() + 1).toString(36).substring(7),
			description: '',
			label: 'Enter Name',
			index: signItems.length
		});
		setSignItems(updatedSign);
	};

	const [signatureNewMessage, signatureRepliesForwards] = useMemo(
		() => [
			find(
				signatures,
				(signature) => signature.value.id === settingsObj.zimbraPrefDefaultSignatureId
			) ?? signatures[0],
			find(
				signatures,
				(signature) => signature.value.id === settingsObj.zimbraPrefForwardReplySignatureId
			) ?? signatures[0]
		],
		[
			settingsObj.zimbraPrefDefaultSignatureId,
			settingsObj.zimbraPrefForwardReplySignatureId,
			signatures
		]
	);
	const updateAllSignatures = (updatedSign) => {
		const allSignatures = updatedSign.map((item) => ({
			label: item.label,
			value: {
				description: unescape(item.description),
				id: item.id
			}
		}));
		setSignatures(allSignatures);
	};
	const ListItem = ({ item }) => {
		const [hovered, setHovered] = useState(false);
		const onMouseEnter = useCallback(() => setHovered(true), []);
		const onMouseLeave = useCallback(() => setHovered(false), []);

		const onDelete = () => {
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
				onClick={(ev) => {
					if (ev.target.innerText === 'DELETE') {
						ev.preventDefault();
					} else {
						setId(item.id);
						setName(item.label);
						setDescription(item.description);
						setIndex(item.index);
					}
				}}
			>
				<Row height="40px" padding={{ all: 'small' }}>
					<Container width="60%" crossAlignment="flex-start">
						<Text weight="bold">{item.label}</Text>
					</Container>

					<Container width="40%" orientation="horizontal" mainAlignment="flex-end">
						{hovered && (
							<Button
								label={t('label.delete', 'Delete')}
								type="outlined"
								color="error"
								onClick={() => onDelete()}
								isSmall
							/>
						)}
					</Container>
				</Row>
			</Signature>
		);
	};
	const [Composer, composerIsAvailable] = useIntegratedComponent('composer');
	const sectionTitleSignatures = useMemo(() => signaturesSubSection(t), [t]);
	const sectionTitleSetSignatures = useMemo(() => setDefaultSignaturesSubSection(t), [t]);
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
									height="47px"
									label={t('signatures.add_signature', 'Add signature')}
									type="outlined"
									onClick={createSign}
									disabled={signItems?.length && !name}
									size="fill"
								/>
							</Container>
							<Padding all="small" />

							<Container height={500}>
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
								onChange={(ev) => {
									setName(ev.target.value);
									const updatedSign = signItems;
									updatedSign[index].label = ev.target.value;
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
									value={unescape(description)}
									onEditorChange={(ev) => {
										const updatedSign = signItems;
										if (index >= 0 && updatedSign[index].description !== ev[1]) {
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
						valueKey="id"
						items={signatures}
						label={t('label.select_signature', 'Select a signature')}
						selection={signatureNewMessage}
						onChange={(e) => {
							updateSettings({
								target: {
									name: 'zimbraPrefDefaultSignatureId',
									value: find(signatures, (signature) => signature?.value?.id === e?.id)?.value?.id
								}
							});
						}}
					/>
					{signatureNewMessage.description && (
						<Container
							crossAlignment="baseline"
							padding={{ all: 'large' }}
							background="gray5"
							dangerouslySetInnerHTML={{ __html: signatureNewMessage.description }}
						/>
					)}
				</Container>
				<Container crossAlignment="baseline" padding={{ all: 'small' }}>
					<Heading title={t('title.replies_forwards', 'Replies & Forwards')} />
					<Select
						valueKey="id"
						items={signatures}
						label={t('label.select_signature', 'Select a signature')}
						selection={signatureRepliesForwards}
						onChange={(e) => {
							updateSettings({
								target: {
									name: 'zimbraPrefForwardReplySignatureId',
									value: find(signatures, (signature) => signature?.value?.id === e?.id)?.value?.id
								}
							});
						}}
					/>
					{signatureRepliesForwards.description && (
						<Container
							crossAlignment="baseline"
							padding={{ all: 'large' }}
							background="gray5"
							dangerouslySetInnerHTML={{ __html: signatureRepliesForwards.description }}
						/>
					)}
				</Container>
			</FormSubSection>
		</>
	);
}
