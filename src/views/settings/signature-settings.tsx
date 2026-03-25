/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useState, useEffect, useCallback, FC, ReactElement, useRef } from 'react';

import styled from '@emotion/styled';
import {
	Container,
	FormSubSection,
	Row,
	Button,
	SelectItem,
	ButtonProps,
	Tooltip,
	Text,
	FormSection,
	Input
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { Composer } from '@zextras/carbonio-ui-text-composer';
import { reject, concat, map } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { NO_SIGNATURE_ID, NO_SIGNATURE_LABEL } from 'helpers/signatures';
import { SignatureSettingsPropsType, SignItemType } from 'types/settings';
import SelectIdentitySignature from 'views/settings/components/select-identity-signature';
import { getFonts, getFontSizesOptions } from 'views/settings/components/utils';
import { ListOld } from 'views/settings/list-old';
import { signaturesSubSection, setDefaultSignaturesSubSection } from 'views/settings/subsections';

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
						<Tooltip label={item.label} overflowTooltip>
							<Text weight="bold">{item.label}</Text>
						</Tooltip>
						<DeleteButton
							data-testid={'delete-signature-button'}
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
		(values: [string, string]): void => {
			if (!getEditor()?.hasFocus()) {
				return;
			}

			if (currentSignature === undefined) {
				return;
			}

			// Rich text signature - values[1] contains the HTML content
			const newDescription = values[1];

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

	const fontSizesOptionsToString = getFontSizesOptions()
		.map((fontSize: string) => fontSize)
		.join(' ');
	const fontsOptionsToString = getFonts().map(
		(font: { label: string; value: string }) => `${font.label}=${font.value};`
	);

	const composerCustomOptions = {
		base_url: `${BASE_PATH}`,
		font_size_formats: fontSizesOptionsToString,
		font_family_formats: fontsOptionsToString,
		auto_focus: false,
		content_style: 'p { margin: 0; }',
		init_instance_callback: onEditorInitialization,
		valid_elements: '*[*]',
		extended_valid_elements: 'p[style|class]',
		cleanup: false,
		verify_html: false,
		forced_root_block: 'p',
		protect: [/&nbsp;/g]
	};

	return (
		<>
			<FormSection label={sectionTitleSignatures.label} id={sectionTitleSignatures.id}>
				<FormSubSection>
					<Container crossAlignment="flex-start" orientation="horizontal" gap={'0.5rem'}>
						<Container width="25%" gap={'1rem'}>
							<Button
								label={t('signatures.add_signature', 'Add signature')}
								type="outlined"
								onClick={addNewSignature}
								disabled={signatures?.length > 0 && !currentSignature?.name}
							/>
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
						<Container width="75%" mainAlignment="flex-start">
							<Input
								label={t('signatures.name', 'Name')}
								value={currentSignature?.name ?? ''}
								disabled={editingDisabled}
								backgroundColor="gray5"
								onChange={onSignatureNameChange}
							/>
							<EditorWrapper>
								<Composer
									data-testid={'signature-editor'}
									value={currentSignature?.description ?? ''}
									customInitOptions={composerCustomOptions}
									onEditorChange={onSignatureContentChange}
									disabled={editingDisabled}
								/>
							</EditorWrapper>
						</Container>
					</Container>
				</FormSubSection>
			</FormSection>
			<FormSection label={sectionTitleSetSignatures.label} id={sectionTitleSetSignatures.id}>
				<FormSubSection>
					<Container crossAlignment="baseline" padding={{ all: 'small' }}>
						{signatures.length > 0 &&
							map(updatedIdentities, (acc, index) => (
								<SelectIdentitySignature
									key={`${acc?.id}-${index}`}
									acc={acc}
									signatures={signatures}
									signatureSelectItems={signatureSelectItems}
									updateIdentities={updateIdentities}
								/>
							))}
					</Container>
				</FormSubSection>
			</FormSection>
		</>
	);
};

export default SignatureSettings;
