/**
 * Reject the request if the requested projects
 * exist on the Partner's dashboard.
 * @param index The index number of the project to be deleted.
 */
Cypress.Commands.add('rejectProject', (index) => {
    cy.getAgent().then((agent) => {
        cy.request({
            method: 'GET',
            url: Cypress.env('apiUrl') + '/order/partner/projects',
            headers: {
                'Authorization': 'Bearer ' + agent.localStorage.token
            }
        }).as('getOrders')
        cy.get('@getOrders').then((response) => {
            var req = response.body.requests;
            if (response.body.total === 0) {
                cy.log('No requests found.')
                return
            }
            const source_id = req[index]._hit._source.id
            if (typeof source_id !== 'undefined') {
                cy.request({
                    method: 'PATCH',
                    url: Cypress.env('apiUrl') + '/order/request/' + source_id + '/refuse',
                    headers: {
                        'Authorization': 'Bearer ' + agent.localStorage.token
                    },
                    body: {
                        reason: "noCapacity",
                        comment: ""
                    }
                }).then((response) => {
                    expect(response.status).to.eq(200)
                })
            }
        })
    })
})

/**
 * Returns the id of the first request if there are requested projects
 * on the dashboard (Partner view). 
 * @param urlAddr The request address to get a request id.
 * @return The request id of the first order on the dashbboard. In case of regional project - 
 * the id of an order is returned.
 */
Cypress.Commands.add('getOrderId', (urlAddr) => {
    cy.getAgent().then((agent) => {
        cy.request({
            method: 'GET',
            url: Cypress.env("apiUrl") + urlAddr,
            headers: {
                'Authorization': 'Bearer ' + agent.localStorage.token
            }
        }).then((response) => {
            expect(response.status).to.eq(200)
            cy.log(response)
            var resp = response.body.requests
            if (response.body.total <= 0) {
                cy.log('No requests found.')
                return
            }
            var source = resp[0]._hit._source
            if (source.order.regional === false) {
                return cy.wrap(source.id)
            } else {
                return cy.wrap(source.order.id)
            }
        })
    })
})

/**
 * Reserves a request and provides the date and time for the "On-site-visit".
 * @param urlAddr The request address to get the request id of the
 * first project on the dashboard.
 */
Cypress.Commands.add('reserveProject', (urlAddr, urlBook) => {
    cy.getOrderId(urlAddr).then((orderId) => {
        const date = new Date()
        date.setHours(15, 0, 0, 0)
        cy.request({
            method: 'PATCH',
            url: Cypress.env("apiUrl") + urlBook + orderId + '/book',
            headers: {
                'Authorization': 'Bearer ' + agent.localStorage.token
            },
            body: {
                dateTime: date.toISOString()
            }
        }).then((response) => {
            cy.log(response)
            expect(response.status).to.eq(200)
        })
    })
})

/**
 * Checks whether the reserved projet was moved to the "On-site-visit" section on the dashboard.
 * @param urlVOB The request to be sent to get the reserved projects.
 */
Cypress.Commands.add('getReservedProject', (urlVOB) => {
    cy.getAgent().then((agent) => {
        cy.request({
            method: 'GET',
            url: Cypress.env("apiUrl") + '/partners/' + agent.partnerId + urlVOB,
            headers: {
                'Authorization': 'Bearer ' + agent.localStorage.token
            }
        }).then((response) => {
            var order = agent.values.orderId
            var resp = response.body.requests
            const found = resp.find(i => i._hit._id === order.toString())
            expect(!!found).to.be.true
        })
    })
})
/**
 * Get the first request on the partner dashboard (Partner Manager view).
 * @param partnerID The partner ID.
 * @return The id of the request. In case of regional project - return the id of the order.
 */
Cypress.Commands.add('getRequestID', (partnerID) => {
    cy.getAgent().then((agent) => {
        cy.request({
            method: 'GET',
            url: Cypress.env("apiUrl") + '/order/partner/' + partnerID + '/projects',
            headers: {
                'Authorization': 'Bearer ' + agent.localStorage.token
            }
        }).then((response) => {
            expect(response.status).to.eq(200)
            var resp = response.body.requests
            if (response.body.total < 1) {
                cy.log('No requests found.')
                return
            }
            var source = resp[0]._hit._source
            if (source.order.regional === false) {
                return cy.wrap(source.id)
            }else{
                return cy.wrap(source.order.id)
            }
  
        })
    })
})

/**
 * Get the remuneration page of the request from Partner Manager view.
 * @param urlAddr The url address to be forwarded to.
 * @param partnerID The id of the partner.
 * @return The id of active offer submission.
 */
Cypress.Commands.add('getOffer', (urlAddr, partnerID) => {
    cy.getAgent().then((agent) => {
        cy.getRequestID(partnerID).then((orderId) => {
            cy.request({
                method: 'GET',
                url: Cypress.env("apiUrl") + urlAddr + orderId + '/offer',
                headers: {
                    'Authorization': 'Bearer ' + agent.localStorage.token
                }
            }).then((response) => {
                var data = response.body.data
                expect(response.status).to.eq(200)
                if (typeof data == undefined) {
                    cy.log('Offer submission not found.')
                    return
                }
                expect(data).not.to.eq(undefined)
                var offerSubmissionID = data.offerSubmission.id
                return cy.wrap(offerSubmissionID)
            })
        })
    })
})

/**
 * Adds the item to the offer.
 * @param urlAdd The url address to send request to for adding an item to the offer.
 * @param urlOffer The url address to send request to for getting the offer.
 * @param partnerID The id of the partner.
 */
Cypress.Commands.add('addItemRemuneration', (urlOffer, partnerID, urlAdd) => {
    cy.getAgent().then((agent) => {
        cy.getOffer(urlOffer, partnerID).then((offerSubmissionID) => {
            cy.request({
                method: 'PUT',
                url: Cypress.env("apiUrl") + urlAdd + offerSubmissionID + '/add',
                headers: {
                    'Authorization': 'Bearer ' + agent.localStorage.token
                },
                body: {
                    service: "service",
                    description: "description",
                    quantity: 1,
                    price: 1,
                    position: 1
                }
            }).then((response) => {
                expect(response.status).to.eq(200)
            })
        })
    })
})
