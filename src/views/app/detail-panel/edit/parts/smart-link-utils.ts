/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import axios from 'axios';

export async function sortFilesByLastModified(): Promise<any> {
	return axios
		.post(
			'/services/files/graphql',
			{
				operationName: 'getChildren',
				variables: {
					node_id: 'LOCAL_ROOT',
					children_limit: 25,
					sort: 'UPDATED_AT_DESC',
					shares_limit: 0
				},
				query: `
				query getChildren($node_id: ID!, $children_limit: Int!, $sort: NodeSort!) {
					getNode(node_id: $node_id) {
						... on Folder {
							children(limit: $children_limit, sort: $sort) {
								nodes {
									id
									name
									type
									updated_at
								}
							}
						}
					}
				}
			`
			},
			{
				headers: {
					'Content-Type': 'application/json',
					Accept: '*/*'
				}
			}
		)
		.catch((error) => {
			console.error('No modified file found:', error.response?.data || error.message);
		});
}

export async function uploadToFiles(file: File): Promise<void> {
	await axios
		.post('/services/files/upload', file, {
			headers: {
				Accept: '*/*',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
				'Content-Type': 'image/jpeg',
				'Content-Length': file.size,
				Filename: btoa(file.name),
				ParentId: 'LOCAL_ROOT'
			}
		})
		.catch((error) => {
			console.error('Upload error:', error.response?.data || error.message);
		});
}

export async function getPublicUrl(nodeId: string): Promise<any> {
	return axios.post(
		'/services/files/graphql',
		{
			operationName: 'createLink',
			variables: {
				node_id: nodeId
			},
			query: `
				mutation createLink($node_id: ID!, $description: String, $expires_at: DateTime, $access_code: String) {
					createLink(
						node_id: $node_id,
						description: $description,
						expires_at: $expires_at,
						access_code: $access_code
					) {
						...Link
						__typename
					}
				}

				fragment Link on Link {
					id
					url
					description
					access_code
					expires_at
					created_at
					node {
						id
						__typename
					}
					__typename
				}
			`
		},
		{
			headers: {
				Accept: '*/*',
				Connection: 'keep-alive',
				'Content-Type': 'application/json',
				Pragma: 'no-cache'
			}
		}
	);
}
