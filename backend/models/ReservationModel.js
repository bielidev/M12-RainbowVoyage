import { PrismaClient, ReservationState } from "@prisma/client";
import "dotenv/config";
import nodemailer from 'nodemailer';
import Mailgen from 'mailgen';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const prismadb = new PrismaClient();

export class ReservationModel {

    static async getAll(userName, reservationState) {
        try {

            let reservations = [];

            if (userName.length === 0) {
                reservations = await prismadb.reservation.findMany({
                    where: {
                        state: reservationState
                    },
                    include: {
                        experience: true,
                        user: true
                    }
                });

            }
            else {
                reservations = await prismadb.reservation.findMany({
                    where: {
                        state: reservationState,
                        name: {
                            startsWith: userName,
                            mode: "insensitive"
                        }
                    },
                    include: {
                        experience: true,
                        user: true
                    }
                });
            }

            return [1, reservations];
        } catch (error) {
            console.log(error);
        }
    }

    static async getByUser(userId) {
        const reservations = await prismadb.reservation.findMany({
            where: {
                user_id: userId
            },
            include: {
                user: true,
                experience: true
            }
        })

        return [1, reservations]
    }

    static async create(userId, bodyData, experienceId) {
        try {

            const { numPeople, dates, dni, phone, email, postalCode, location, address, name, lastName } = bodyData;

            let { dateId } = bodyData
            dateId = Number(dateId);

            const dateCreation = new Date();
            //Store new pending reservation in database.
            const newReservation = await prismadb.reservation.create({
                data: {
                    user_id: userId,
                    date_creation: dateCreation,
                    state: ReservationState.pending,
                    num_people: Number(numPeople),
                    experience_id: Number(experienceId),
                    dates: dates,
                    dni: dni,
                    phone: phone,
                    reservation_email: email,
                    postal_code: postalCode,
                    city: location,
                    address: address,
                    name: name,
                    last_name: lastName
                }
            })

            //Update date availability for 

            const d = await prismadb.dateAvailabilty.findFirst({
                where: {
                    id: dateId
                }
            })


            const update = await prismadb.dateAvailabilty.updateMany({
                where: {
                    id: dateId
                },
                data: {
                    current_people: d.current_people + Number(numPeople) + 1
                }
            })

            return 1;

        } catch (error) {
            console.log(error);
        }
    }

    static async sendEmail(reservationId) {

        const reservation = await prismadb.reservation.findFirst({
            where: {
                id: reservationId
            },
            include: {
                experience: true
            }
        });

        // const transporter = nodemailer.createTransport({
        //     host: 'smtp.mailtrap.io',
        //     port: 2525,
        //     auth: {
        //         user: process.env.USER_EMAIL,
        //         pass: process.env.PASSWORD_EMAIL,
        //     }
        // });

        const MailGenerator = new Mailgen({
            theme: "default",
            product: {
                name: "Rainbow Voyage",
                link: 'hola.com'
            }
        })

        const __dirname = path.dirname(fileURLToPath(import.meta.url));

        const imagePath = path.join(__dirname.replace('/models', ''), 'public', 'static', 'images', 'logo.webp');

        const imageData = fs.readFileSync(imagePath);
        const imageBase64 = Buffer.from(imageData).toString('base64');

        const imageUrl = `data:image/jpeg;base64,${imageBase64}`;

        const email = {
            body: {
                title: `
                    <img src="${imageUrl}" style='width:100px' alt="Imagen de ejemplo"><br/>
                    <span style='color:rgba(217, 5, 148, 1)'>Buenas ${reservation.name}</span>
                `,
                intro:
                    `
                    Muchas gracias por confiar en Rainbow Voyage.<br/>
                    Tu reserva para <b style='color:rgba(217, 5, 148, 1)'>${reservation.experience.name}</b> en las fechas <b style='color:rgba(217, 5, 148, 1)'>${reservation.dates}</b> se ha confirmado correctamente.<br/>
                    ¡Esperamos que disfutes de tu viaje!

                `,
                outro: `Para cualquier duda o consulta que tengas sobre el viaje no dudes en contactarnos al siguiente teléfono <b style='color:rgba(217, 5, 148, 1)'>123456789</b>.`,
                signature: 'Coordialmente',
                table: {
                    data: [
                        {
                            Titular: `${reservation.name} ${reservation.last_name}`,
                            Experiencia: `${reservation.experience.name}`,
                            Personas: `${reservation.num_people + 1}`,
                            Dias: `${reservation.dates}`,
                            Precio: `${reservation.experience.price}€`
                        },
                    ],
                    columns: {
                        customWidth: {
                            Titular: '30%',
                            Experiencia: '20%',
                            Precio: '15%',
                            Dias: '35%'
                        },
                        customAlignment: {
                            Precio: 'right'
                        }
                    }
                }
            }
        }
        const emailBody = MailGenerator.generate(email);

        const mailOptions = {
            from: 'rainbow@gmail.com',
            to: reservation.reservation_email,
            subject: `Confirmación de reserva - ${reservation.experience.name} - ${reservation.name} ${reservation.last_name} `,
            html: emailBody
        };


        //Mark reservation as completed 

        //To test email format.
        fs.writeFileSync('preview.html', emailBody, 'utf8');


        return [1, mailOptions];



    }

}