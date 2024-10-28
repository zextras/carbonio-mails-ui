/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useState, useEffect, useCallback, FC, ReactElement, useRef } from 'react';

import {
	Container,
	FormSubSection,
	TextWithTooltip,
	Input,
	Row,
	Button,
	Padding,
	SelectItem,
	ButtonProps
} from '@zextras/carbonio-design-system';
import { t, useIntegratedComponent } from '@zextras/carbonio-shell-ui';
import { map, reject, concat } from 'lodash';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

import SelectIdentitySignature from './components/select-identity-signature';
import { ListOld } from './list-old';
import { signaturesSubSection, setDefaultSignaturesSubSection } from './subsections';
import { NO_SIGNATURE_ID, NO_SIGNATURE_LABEL } from '../../helpers/signatures';
import type { SignatureSettingsPropsType, SignItemType } from '../../types';

const DeleteButton = styled(Button)`
	display: none;
`;

const Signature = styled(Row)`
	border-bottom: 0.0625rem solid ${({ theme }): string => theme.palette.gray2.regular};
	display: block;
	border-radius: 0;
	cursor: pointer;

	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray6.focus};

		& ${DeleteButton} {
			display: flex;
		}
	}
`;
const EditorWrapper = styled.div`
	width: 100%;
	height: 100%;
	overflow-y: auto;
	position: relative;
`;

/**
 * Temporary type narrowed to the only properties/methods used in this context
 */
type EditorType = {
	hasFocus: () => boolean;
};

const SignatureSettings: FC<SignatureSettingsPropsType> = ({
	updatedIdentities,
	updateIdentities,
	setDisabled,
	signatures,
	setSignatures
}): ReactElement => {
	const [currentSignature, setCurrentSignature] = useState<SignItemType | undefined>(undefined);
	const [Composer, composerIsAvailable] = useIntegratedComponent('composer');
	const sectionTitleSignatures = useMemo(() => signaturesSubSection(), []);
	const sectionTitleSetSignatures = useMemo(() => setDefaultSignaturesSubSection(), []);
	const editorRef = useRef<{ editor: EditorType | undefined }>({
		editor: undefined
	});

	const getEditor = (): EditorType | undefined => editorRef.current.editor;

	const setEditor = (editor: EditorType): void => {
		editorRef.current.editor = editor;
	};

	// Set the default current signature if missing
	useEffect(() => {
		if (signatures?.length && !currentSignature) {
			setCurrentSignature(signatures[0]);
		}
	}, [currentSignature, setCurrentSignature, signatures]);

	// Creates an empty signature
	const createEmptySignature = useCallback(
		(): SignItemType => ({
			id: `unsaved-signature-${uuidv4()}`,
			label: t('label.enter_name', 'Enter Name'),
			name: t('label.enter_name', 'Enter Name'),
			description: ''
		}),
		[]
	);

	// Creates and adds a new signature to the signatures list
	const addNewSignature = useCallback((): void => {
		const updatedSign = [...signatures];
		const newSignature = createEmptySignature();
		updatedSign.push(newSignature);
		setSignatures(updatedSign);
		setCurrentSignature(newSignature);
	}, [createEmptySignature, setSignatures, signatures]);

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
			concat(noSignature, signatures)
				.filter((signature) => !signature.id.includes('unsaved-signature-'))
				.map((signature) => ({
					label: signature.label,
					value: signature.id
				})),
		[noSignature, signatures]
	);

	const ListItem = ({ item }: { item: SignItemType }): ReactElement => {
		const onSignatureClick = useCallback(
			(ev: React.MouseEvent): void => {
				setCurrentSignature({
					id: item.id,
					name: item.label ?? '',
					label: item.label ?? '',
					description: item.description ?? ''
				});
			},
			[item.description, item.id, item.label]
		);

		const onDeleteButtonClick = useCallback(
			(ev: Parameters<ButtonProps['onClick']>[0]): void => {
				ev.stopPropagation();
				// Create a new signature array copy without the deleted element
				const updatedSignatureList = reject(signatures, ['id', item.id]);
				if (currentSignature?.id === item.id) {
					setCurrentSignature(undefined);
				}
				setSignatures(updatedSignatureList);
				setDisabled(false);
			},
			[item.id]
		);

		return (
			<Signature
				height="fit"
				orientation="horizontal"
				background={currentSignature?.id === item.id ? 'highlight' : ''}
				onClick={onSignatureClick}
			>
				<Row height="2.5rem" padding={{ all: 'small' }}>
					<Container orientation="horizontal" mainAlignment="space-between">
						<TextWithTooltip weight="bold">{item.label}</TextWithTooltip>
						<DeleteButton
							label={t('label.delete', 'Delete')}
							type="outlined"
							color="error"
							width="fit"
							onClick={onDeleteButtonClick}
						/>
					</Container>
				</Row>
			</Signature>
		);
	};

	const editingDisabled = useMemo<boolean>(
		(): boolean => currentSignature === undefined,
		[currentSignature]
	);

	const onSignatureNameChange = useCallback(
		(ev: React.ChangeEvent<HTMLInputElement>): void => {
			if (!currentSignature) {
				return;
			}
			const newName = ev.target.value;
			if (currentSignature?.name === newName) {
				return;
			}

			setCurrentSignature(
				(current) =>
					({
						...current,
						name: newName,
						label: newName
					}) as SignItemType
			);

			const updatedSignatures = signatures.map((signature) => {
				if (signature.id === currentSignature?.id) {
					return {
						...signature,
						label: newName,
						name: newName
					};
				}
				return signature;
			});

			setDisabled(false);
			setSignatures(updatedSignatures);
		},
		[currentSignature, setCurrentSignature, setDisabled, setSignatures, signatures]
	);

	const onSignatureContentChange = useCallback(
		(ev: [string, string]): void => {
			if (!getEditor()?.hasFocus()) {
				return;
			}

			if (currentSignature === undefined) {
				return;
			}

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
					}) as SignItemType
			);

			const updatedSign = signatures.map((signature) => {
				if (signature.id === currentSignature?.id && signature.description !== newDescription) {
					return {
						...signature,
						description: newDescription
					};
				}
				return signature;
			});

			setDisabled(false);
			setSignatures(updatedSign);
		},
		[currentSignature, setCurrentSignature, setDisabled, setSignatures, signatures]
	);

	const onEditorInitialization = (editor: EditorType): void => {
		setEditor(editor);
	};

	const composerCustomOptions = {
		auto_focus: false,
		content_style: 'p { margin: 0; }',
		init_instance_callback: onEditorInitialization
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
								{signatures.length > 0 && (
									<ListOld
										data-testid={'signatures-list'}
										items={signatures ?? []}
										ItemComponent={ListItem}
									/>
								)}
							</Container>
						</Container>
					</Container>
					<Container width="75%" mainAlignment="flex-start">
						<Container orientation="vertical" mainAlignment="space-around" width="100%">
							<Input
								label={t('signatures.name', 'Name')}
								value={currentSignature?.name ?? ''}
								disabled={editingDisabled}
								backgroundColor="gray5"
								onChange={onSignatureNameChange}
							/>
						</Container>
						<Padding all="small" />
						{composerIsAvailable && (
							<EditorWrapper>
								<Composer
									data-testid={'signature-editor'}
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									value={currentSignature?.description ?? ''}
									customInitOptions={composerCustomOptions}
									disabled={editingDisabled}
									onEditorChange={onSignatureContentChange}
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
					{signatures.length > 0 &&
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
