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
	List,
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
import { signaturesSubSection, setDefaultSignaturesSubSection } from './subsections';
import { NO_SIGNATURE_ID, NO_SIGNATURE_LABEL } from '../../helpers/signatures';
import { GetAllSignatures } from '../../store/actions/signatures';
import type { SignatureSettingsPropsType, SignItemType } from '../../types';
import { TextArea } from '../app/detail-panel/edit/parts/edit-view-styled-components';

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
	settingsObj,
	account,
	updatedIdentities,
	updateIdentities,
	setDisabled,
	signatures,
	setSignatures,
	setOriginalSignatures,
	originalSignatures
}): ReactElement => {
	const [currentSignature, setCurrentSignature] = useState<SignItemType | undefined>(undefined);
	const [Composer, composerIsAvailable] = useIntegratedComponent('composer');
	const sectionTitleSignatures = useMemo(() => signaturesSubSection(), []);
	const sectionTitleSetSignatures = useMemo(() => setDefaultSignaturesSubSection(), []);
	const [signaturesLoaded, setSignaturesLoaded] = useState(false);
	const editorRef = useRef<{ editor: EditorType | undefined }>({
		editor: undefined
	});

	const getEditor = (): EditorType | undefined => editorRef.current.editor;

	const setEditor = (editor: EditorType): void => {
		editorRef.current.editor = editor;
	};

	const defaultFontFamily = useMemo<string>(
		() => String(settingsObj?.zimbraPrefHtmlEditorDefaultFontFamily) ?? 'arial,helvetica,sans-serif',
		[settingsObj]
	);

	const defaultFontColor = useMemo<string>(
		() => String(settingsObj?.zimbraPrefHtmlEditorDefaultFontColor) ?? '#000000',
		[settingsObj]
	);

	const defaultFontSize = useMemo<string>(
		() => String(settingsObj?.zimbraPrefHtmlEditorDefaultFontSize) ?? '12pt',
		[settingsObj]
	);

	const prefComposeFormat = useMemo<string>(
		() => String(settingsObj?.zimbraPrefComposeFormat) ?? 'text',
		[settingsObj]
	);

	const getSignatureFormat = (format: string): "text/html" | "text/plain" | undefined => {
		if (format == "html") return 'text/html';
		if (format == "text") return 'text/plain';
		return undefined;
	}

	const getCurrentSignature = (cSign: SignItemType|undefined, cFormat: "text/html" | "text/plain" | undefined ): string => {
		if ( cSign === undefined || cSign.content === undefined ) return "";
		const objIndex = cSign.content.findIndex(obj => obj.type == cFormat);
		if (objIndex !== -1) {
			const content = cSign.content[objIndex]._content;
			return content !== undefined ? content : "";
		}
		return "";
	}

	const signatureFormat = getSignatureFormat(prefComposeFormat);
	const signatureValue = getCurrentSignature(currentSignature,signatureFormat);

	// Fetches signatures from the BE
	useEffect(() => {
		GetAllSignatures().then(({ signature: signs }) => {
			const signaturesItems = map(signs,(item: SignItemType, idx) =>
				{
					const signContents = item.content;
					let usedSign = "";
					if (signContents !== undefined) {
						for (const sContent of signContents) {
							if (sContent.type == signatureFormat &&
								sContent._content !== undefined) {
								usedSign = sContent._content;
							}
						}
					}
				    return ({
						label: item.name,
						name: item.name,
						id: item.id,
						usedSign: usedSign,
						content : item?.content
					} as SignItemType);
			});
			setSignatures(signaturesItems);
			setOriginalSignatures(
				signaturesItems.map((el) => ({
					id: el.id,
					name: el.label ?? '',
					label: el.label ?? '',
					usedSign: el.usedSign ?? '',
					content: el.content
				}))
			);

			// Updates state to enable the loading of all signatures-dependent component
			setSignaturesLoaded(true);
		});
	}, [setSignatures, setOriginalSignatures, signatureFormat]);

	// Set the default current signature if missing
	useEffect(() => {
		if (signatures?.length && !currentSignature) {
			setCurrentSignature(signatures[0]);
			/*for (const signs of signatures) {
				if (signs.id == signatureId && typeof(signs?.content) != "undefined") {
					setCurrentSignature(signs);
					break;
				}
			}*/
		}
	}, [currentSignature, setCurrentSignature, signatures]);

	// Creates an empty signature
	const createEmptySignature = useCallback(
		(): SignItemType => ({
			id: uuidv4(),
			label: t('label.enter_name', 'Enter Name'),
			name: t('label.enter_name', 'Enter Name'),
			usedSign: '',
			content: [{
				type: signatureFormat,
				_content: ''
			}]
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
	}, [createEmptySignature, setSignatures, signatures, setSignaturesLoaded]);

	// Create the fake signature for the "no signature"
	const noSignature: SignItemType = useMemo(
		() => ({
			label: t('label.no_signature', NO_SIGNATURE_LABEL),
			name: 'no signature',
			usedSign: '',
			id: NO_SIGNATURE_ID,
			content: [{
				type: signatureFormat,
				_content: ''
			}]
		}),
		[]
	);

	// Composes the SelectItem array for the signature selects
	const signatureSelectItems: SelectItem[] = useMemo(
		(): SelectItem[] =>
			concat(noSignature, originalSignatures).map((signature) => ({
				label: signature.label,
				value: signature.id
			})),
		[noSignature, originalSignatures]
	);

	const ListItem = ({ item }: { item: SignItemType }): ReactElement => {
		const onSignatureClick = useCallback(
			(ev: React.MouseEvent & { target: { innerText?: string } }): void => {
				setCurrentSignature({
					id: item.id,
					name: item.label ?? '',
					label: item.label ?? '',
					usedSign: item.usedSign ?? '',
					content: item.content
				});
			},
			[item.usedSign, item.id, item.label]
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
					} as SignItemType)
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
			if (signatureFormat == "text/html" && !getEditor()?.hasFocus()) {
				return;
			}

			if (currentSignature === undefined) {
				return;
			}

			// Rich text signature
			const newSignature = ev[1];

			if (currentSignature?.usedSign === newSignature) {
				return;
			}

			let contentSigns = currentSignature.content;
			if  (
				contentSigns !== undefined
					&& contentSigns.findIndex(obj => obj.type == signatureFormat) !== -1
				) {
				const objIndex = contentSigns.findIndex(obj => obj.type == signatureFormat);
				const updatedObj = {
					...contentSigns[objIndex],
					_content: newSignature
				};
				contentSigns[objIndex] = updatedObj;
			} else {
				const newObj = {
					type: signatureFormat,
					_content: newSignature
				};
				if (contentSigns !== undefined) {
					contentSigns.push(newObj);
				} else {
					contentSigns = [newObj];
				}
			}

			setCurrentSignature(
				(current) =>
					({
						...current,
						usedSign: newSignature,
						content: contentSigns
					} as SignItemType)
			);

			const updatedSign = signatures.map((signature) => {
				if (signature.id === currentSignature?.id && signature.usedSign !== newSignature) {
					return {
						...signature,
						usedSign: newSignature,
						content: contentSigns
					};
				}
				return signature;
			});

			setDisabled(false);
			setSignatures(updatedSign);

		},
		[currentSignature, setCurrentSignature, setDisabled, setSignatures, signatures, signatureFormat, account]
	);

	const onEditorInitialization = (editor: EditorType): void => {
		setEditor(editor);
	};

	const composerCustomOptions = {
		auto_focus: false,
		content_style: `body  {  color: ${defaultFontColor}; font-size: ${defaultFontSize}; font-family: ${defaultFontFamily}; } p { margin: 0; }`,
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
									disabled={
										(signatures?.length > 0 && !currentSignature?.name) ||
										(originalSignatures?.length < signatures?.length)}
								/>
							</Container>
							<Padding all="small" />

							<Container height="31.25rem">
								{signaturesLoaded && (
									<List
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
						{composerIsAvailable && prefComposeFormat == "html" && (
							<EditorWrapper>
								<Composer
									data-testid={'signature-editor'}
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									value={signatureValue}
									customInitOptions={composerCustomOptions}
									disabled={editingDisabled}
									onEditorChange={onSignatureContentChange}
								/>
							</EditorWrapper>
						)}
						{(!composerIsAvailable || prefComposeFormat == "text") && (
							<EditorWrapper>
								<TextArea
								data-testid="MailPlainTextEditor"
								value={signatureValue}
								style={{
									fontFamily: defaultFontFamily,
									fontSize: defaultFontSize,
									color: defaultFontColor,
									border: "solid 1px black"
								}}
								onChange={(ev): void => {
									onSignatureContentChange([
										ev.target.value,
										ev.target.value
									])
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
								signatures={originalSignatures}
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
