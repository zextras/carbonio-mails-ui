/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useState, useEffect, useCallback, FC, ReactElement } from 'react';

import {
	Container,
	FormSubSection,
	TextWithTooltip,
	Input,
	List,
	Row,
	Button,
	Padding,
	SelectItem
} from '@zextras/carbonio-design-system';
import { t, useIntegratedComponent } from '@zextras/carbonio-shell-ui';
import { map, unescape, reject, concat } from 'lodash';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

import SelectIdentitySignature from './components/select-identity-signature';
import { signaturesSubSection, setDefaultSignaturesSubSection } from './subsections';
import { NO_SIGNATURE_ID, NO_SIGNATURE_LABEL } from '../../helpers/signatures';
import { GetAllSignatures } from '../../store/actions/signatures';
import type { SignatureSettingsPropsType, SignItemType } from '../../types';

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
	updatedIdentities,
	updateIdentities,
	setDisabled,
	signatures,
	setSignatures,
	setOriginalSignatures
}): ReactElement => {
	const [currentSignature, setCurrentSignature] = useState<SignItemType | undefined>(undefined);
	const [Composer, composerIsAvailable] = useIntegratedComponent('composer');
	const sectionTitleSignatures = useMemo(() => signaturesSubSection(), []);
	const sectionTitleSetSignatures = useMemo(() => setDefaultSignaturesSubSection(), []);
	const [signaturesLoaded, setSignaturesLoaded] = useState(false);
	const [isFirstChangeEventFired, setIsFirstChangeEventFired] = useState(false);

	// Fetches signatures from the BE
	useEffect(() => {
		GetAllSignatures().then(({ signature: signs }) => {
			const signaturesItems = map(
				signs,
				(item: SignItemType, idx) =>
					({
						label: item.name,
						name: item.name,
						id: item.id,
						description: unescape(item?.content?.[0]?._content)
					} as SignItemType)
			);
			setSignatures(signaturesItems);
			setOriginalSignatures(
				signaturesItems.map((el) => ({
					id: el.id,
					name: el.label ?? '',
					label: el.label ?? '',
					description: el.description ?? ''
				}))
			);

			// Updates state to enable the loading of all signatures-dependent component
			setSignaturesLoaded(true);
		});
	}, [setSignatures, setOriginalSignatures]);

	// Set the default current signature if missing
	useEffect(() => {
		if (signatures?.length && !currentSignature) {
			setCurrentSignature(signatures[0]);
		}
	}, [currentSignature, signatures]);

	// Creates an empty signature
	const createEmptySignature = (): SignItemType => ({
		id: uuidv4(),
		label: t('label.enter_name', 'Enter Name'),
		name: t('label.enter_name', 'Enter Name'),
		description: ''
	});

	// Creates and adds a new signature to the signatures list
	const addNewSignature = (): void => {
		const updatedSign = [...signatures];
		const newSignature = createEmptySignature();
		updatedSign.push(newSignature);
		setSignatures(updatedSign);
		setCurrentSignature(newSignature);
	};

	// Create the fake signature for the "no signature"
	const noSignature: SignItemType = useMemo(
		() => ({
			label: t('label.no_signature', NO_SIGNATURE_LABEL),
			name: 'no signature',
			description: '',
			id: NO_SIGNATURE_ID
		}),
		[]
	);

	// Composes the SelectItem array for the signature selects
	const signatureSelectItems: SelectItem[] = useMemo(
		(): SelectItem[] =>
			concat(noSignature, signatures).map((signature) => ({
				label: signature.label,
				value: signature.id
			})),
		[noSignature, signatures]
	);

	const ListItem = ({ item }: { item: SignItemType }): ReactElement => {
		const [hovered, setHovered] = useState(false);
		const onMouseEnter = useCallback(() => setHovered(true), []);
		const onMouseLeave = useCallback(() => setHovered(false), []);

		const onDelete = (): void => {
			// Create a new signature array copy without the deleted element
			const updatedSignatureList = reject(signatures, ['id', item.id]);
			if (currentSignature?.id === item.id) {
				setCurrentSignature(undefined);
			}
			setSignatures(updatedSignatureList);
			setDisabled(false);
		};

		return (
			<Signature
				height="fit"
				orientation="horizontal"
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				background={currentSignature?.id === item.id ? 'highlight' : ''}
				onClick={(ev: React.MouseEvent & { target: { innerText?: string } }): void => {
					setCurrentSignature({
						id: item.id,
						name: item.label ?? '',
						label: item.label ?? '',
						description: item.description ?? ''
					});
					setIsFirstChangeEventFired(false);
				}}
			>
				<Row height="2.5rem" padding={{ all: 'small' }}>
					<Container orientation="horizontal" mainAlignment="space-between">
						<TextWithTooltip weight="bold">{item.label}</TextWithTooltip>
						{hovered && (
							<Button
								label={t('label.delete', 'Delete')}
								type="outlined"
								color="error"
								width="fit"
								onClick={(ev): void => {
									ev.stopPropagation();
									onDelete();
								}}
							/>
						)}
					</Container>
				</Row>
			</Signature>
		);
	};

	const composerCustomOptions = {
		auto_focus: false,
		newline_behavior: 'linebreak'
	};

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
									onClick={addNewSignature}
									disabled={signatures?.length > 0 && !currentSignature?.name}
								/>
							</Container>
							<Padding all="small" />

							<Container height="31.25rem">
								{signaturesLoaded && <List items={signatures ?? []} ItemComponent={ListItem} />}
							</Container>
						</Container>
					</Container>
					<Container width="75%" mainAlignment="flex-start">
						<Container orientation="vertical" mainAlignment="space-around" width="100%">
							<Input
								label={t('signatures.name', 'Name')}
								value={currentSignature?.name}
								backgroundColor="gray5"
								onChange={(ev: React.ChangeEvent<HTMLInputElement>): void => {
									if (!currentSignature) {
										return;
									}
									const newName = ev.target.value;
									if (currentSignature.name === newName) {
										return;
									}

									setCurrentSignature(
										(current) =>
											({
												...current,
												name: newName,
												label: newName
											} as SignItemType)
									);

									const updatedSign = signatures.map((signature) => {
										if (signature.id === currentSignature.id) {
											return {
												...signature,
												label: newName,
												name: newName
											};
										}
										return signature;
									});

									setDisabled(false);
									setSignatures(updatedSign);
								}}
							/>
						</Container>
						<Padding all="small" />
						{composerIsAvailable && (
							<EditorWrapper>
								<Composer
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									value={currentSignature?.description}
									customInitOptions={composerCustomOptions}
									onEditorChange={(ev: [string, string]): void => {
										if (isFirstChangeEventFired) {
											// Rich text signature
											const newDescription = ev[1];
											if (currentSignature?.description === newDescription) {
												return;
											}
											setCurrentSignature(
												(current) =>
													({
														...current,
														description: newDescription
													} as SignItemType)
											);

											const updatedSign = signatures.map((signature) => {
												if (
													signature.id === currentSignature?.id &&
													signature.description !== newDescription
												) {
													return {
														...signature,
														description: newDescription
													};
												}
												return signature;
											});

											setDisabled(false);
											setSignatures(updatedSign);
										}
										setIsFirstChangeEventFired(true);
									}}
								/>
							</EditorWrapper>
						)}
					</Container>
				</Container>
			</FormSubSection>
			<FormSubSection
				label={sectionTitleSetSignatures.label}
				id={sectionTitleSetSignatures.id}
				padding={{ all: 'large' }}
			>
				<Container crossAlignment="baseline" padding={{ all: 'small' }}>
					{signaturesLoaded &&
						map(updatedIdentities, (acc) => (
							<SelectIdentitySignature
								acc={acc}
								signatures={signatures}
								signatureSelectItems={signatureSelectItems}
								updateIdentities={updateIdentities}
							/>
						))}
				</Container>
			</FormSubSection>
		</>
	);
};

export default SignatureSettings;
