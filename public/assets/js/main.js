/*
    *  -----------------------------------------------------  *
    *  -----  /main.js  --  /public/assets/js/main.js  -----  *
    *  -----------------------------------------------------  *
*/


(() => {


    /** @type {string} -----  `Ruta base del proyecto`  ----- */
    const base = '/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/07-traducciones-deepseek';


    //  -----  Referencias al DOM  -----

    /** @type {HTMLButtonElement | null} - `botón de traduccion` */
    const $translateButton = document.querySelector('#translateButton');

    /** @type {HTMLTextAreaElement | null} - `input de texto` */
    const $inputText = document.querySelector('#inputText');

    /** @type {HTMLSelectElement | null} - `select de lenguaje destino` */
    const $targetLang = document.querySelector('#targetLang');

    /** @type {HTMLDivElement | null} - `contenedor de mensajes del chat` */
    const $chatMessages = document.querySelector('.chat__messages');



    /**
     * ----------------------------
     * -----  `scrollChat()`  -----
     * ----------------------------
     * - Desplaza el contenedor de mensajes del chat hacia abajo para mostrar el nuevo mensaje.
     */

    const scrollChat = () => {

        //  -----  Desplazar el contenedor de mensajes del chat hacia abajo para mostrar el nuevo mensaje  -----
        if ($chatMessages)
            $chatMessages.scrollTop = $chatMessages.scrollHeight;
    };



    /**
     * ------------------------------------
     * -----  `appendUserMessage()`  -----
     * ------------------------------------
     * - Crea y agrega el mensaje del usuario al contenedor del chat.
     * @param {string} text - `texto ingresado por el usuario`
     */
    
    const appendUserMessage = (text) => {

        /** @type {HTMLDivElement} - `crear mensaje de usuario` */
        const $userMessage = document.createElement('div');

        //  -----  Agregar clases CSS para el mensaje de usuario  -----
        $userMessage.classList.add('chat__message', 'chat__message--user');

        //  -----  Establecer el contenido del mensaje de usuario  -----
        $userMessage.textContent = `Tú: ${text}`;

        //  -----  Agregar el mensaje de usuario al contenedor de mensajes del chat  -----
        $chatMessages?.appendChild($userMessage);

        //  -----  Desplazar el contenedor de mensajes del chat hacia abajo para mostrar el nuevo mensaje  -----
        scrollChat();

    };



    /**
     * -------------------------------------
     * -----  `generateUserMessage()`  -----
     * -------------------------------------
     * - Genera el mensaje del usuario a partir del texto ingresado en el input y la selección del idioma de destino, y lo agrega al chat.
     * @returns {TraduccionRequest | undefined} - Objeto con el texto ingresado y el idioma de destino, o `undefined` si hay un error.
     */

    const generateUserMessage = () => {

        /**  -----  `texto ingresado en el input` -----  */
        const text = $inputText?.value.trim();

        /**  -----  `selección del idioma de destino`  -----  */
        const targetLang = $targetLang?.value;

        //  -----  Validar texto ingresado  -----
        if (!text) {
            alert('Por favor, ingresa un texto para traducir.');
            return;
        }

        //  -----  Validar selección de idioma de destino  -----
        if (!targetLang) {
            alert('Por favor, selecciona un idioma de destino.');
            return;
        }

        //  -----  Agregar mensaje del usuario al chat  -----
        appendUserMessage(text);

        
        /** @type {TraduccionRequest} */
        const userMessage = {
            text, 
            targetLang 
        };

        //  -----  Retornar texto e idioma de destino para su uso en la función de traducción  -----
        return userMessage;

    }



    /**
     * ------------------------------------
     * -----  `fetchTranslation()`  -----
     * ------------------------------------
     * @async
     * - Realiza la petición a la API de traducción y retorna el texto traducido.
     * @param {string} text - `texto a traducir`
     * @param {string} targetLang - `idioma de destino`
     * @returns {Promise<string>} - Texto traducido.
     * @throws {Error} - Lanza un error si la API falla o no devuelve una traducción válida.
     */

    const fetchTranslation = async (text, targetLang) => {


        /**  -----  `Petición asincrónica a la API de traducción`  -----  */
        const response = await fetch(`${base}/api/traducir`, {

            //  -----  Método HTTP POST para enviar los datos de traducción  -----
            method: 'POST',

            //  -----  Encabezados para indicar que el cuerpo de la solicitud es JSON  -----
            headers: {
                'Content-Type': 'application/json'
            },

            //  -----  Cuerpo de la solicitud con el texto a traducir y el idioma de destino  -----
            body: JSON.stringify({
                text,
                targetLang
            })

        });


        //  -----  Obtener datos de la respuesta de la API de traducción  -----  
        
        /** @type {TraduccionResponse} */
        const data = await response.json();

        console.log('Respuesta de la API de traducción => ', data);


        //  -----  Validar respuesta de la API  -----
        if (!response.ok)
            throw new Error(data.error || 'Error desconocido al traducir el texto');


        //  -----  Extraer la traducción de los datos de la respuesta  -----
        const { translation } = data;

        //  -----  Validar que se haya recibido una traducción válida  -----
        if (!translation) {
            throw new Error('La API no devolvió una traducción válida');
        }

        console.log('translation => ', translation);

        //  -----  Retornar la traducción obtenida de la API  -----
        return translation;

    };



    /**
     * ---------------------------------------------
     * -----  `appendBotMessage(translation)`  -----
     * ---------------------------------------------
     * - Crea y agrega el mensaje de la IA al contenedor del chat.
     * - Si se indica `isTyping`, marca el mensaje como "Escribiendo..." con su clase específica.
     * - Devuelve la referencia al elemento creado para poder actualizarlo después (p. ej. reemplazar "Escribiendo..." por la respuesta final).
     * @param {string} translation - `texto traducido por la IA`
     * @param {boolean} [isTyping=false] - `true` para aplicar el estilo del estado "Escribiendo..."`
     * @returns {HTMLDivElement | undefined} - `elemento del mensaje del bot añadido al chat`
     */

    const appendBotMessage = (translation, isTyping = false) => {

        /** @type {HTMLDivElement} - `crear mensaje de la IA` */
        const $botMessage = document.createElement('div');

        //  -----  Agregar clases CSS para el mensaje de la IA  -----
        $botMessage.classList.add('chat__message', 'chat__message--bot');

        //  -----  Si es el estado "Escribiendo...", añadimos su clase específica  -----
        if (isTyping)
            $botMessage.classList.add('chat__message--typing');

        //  -----  Establecer el contenido del mensaje de la IA con la traducción recibida  -----
        $botMessage.textContent = isTyping
            ? `Traductor: ${translation}`
            : `Traductor: ${translation}`;

        //  -----  Agregar el mensaje de la IA al contenedor de mensajes del chat  -----
        $chatMessages?.appendChild($botMessage);

        //  -----  Desplazar el contenedor de mensajes del chat hacia abajo para mostrar el nuevo mensaje  -----
        scrollChat();

        return $botMessage;

    };



    /**
     * -------------------------------------
     * -----  `generateTranslation()`  -----
     * ------------------------------------- 
     * @async
     * - Genera la traducción del texto ingresado por el usuario utilizando la API de traducción.
     * - Muestra un mensaje "Escribiendo..." con animación de puntos mientras se espera la respuesta.
     * @returns {Promise<void>} - No devuelve ningún valor, pero actualiza el DOM con los mensajes del usuario y la traducción generada.
     * @throws {Error} - Lanza un error si ocurre algún problema durante la traducción, como una respuesta no válida de la API o problemas de red.
     */
    
    const generateTranslation = async () => {


        /** @type {TraduccionRequest | undefined}  - `Generar mensaje del usuario y obtener texto e idioma`  */
        const userMessage = generateUserMessage();

        //  -----  Si la validación falla, no continuar  -----
        if (!userMessage) 
            return;

        //  -----  Extraer texto e idioma de destino del mensaje del usuario  -----
        const { text, targetLang } = userMessage;


        //  -----  Intentar traducir el texto usando la API de traducción  -----
        try {


            /** @type {HTMLDivElement | undefined} - `elemento temporal con el texto "Escribiendo..." que se reemplazará al recibir la respuesta` */
            const $typingMessage = appendBotMessage('Escribiendo.', true);

            /** @type {number} - `contador de puntos para la animación de "Escribiendo..."` */
            let dots = 1;

            /** @type {ReturnType<typeof setInterval> | undefined} - `intervalo que actualiza los puntos del mensaje "Escribiendo..."` */
            const typingInterval = setInterval(() => {

                //  -----  Ciclar entre 1, 2 y 3 puntos  -----
                dots = (dots % 3) + 1;

                //  -----  Actualizar el texto del mensaje "Escribiendo..." con los puntos correspondientes  -----
                if ($typingMessage)
                    $typingMessage.textContent = `Traductor: Escribiendo${'.'.repeat(dots)}`;

            }, 500);


            /**  -----  Traducir el texto usando la API de traducción  -----  */
            const translation = await fetchTranslation(text, targetLang);


            //  -----  Detenemos la animación de "Escribiendo..."  -----
            clearInterval(typingInterval);


            //  -----  Reemplazamos el contenido del mensaje "Escribiendo..." por la respuesta real del bot  -----
            //  -----  y quitamos la clase de "Escribiendo..."                       -----
            if ($typingMessage) {

                $typingMessage.textContent = `Traductor: ${translation}`;
                $typingMessage.classList.remove('chat__message--typing');

            } else
                appendBotMessage(translation);


            //  -----  Desplazar el contenedor de mensajes del chat hacia abajo para mostrar la nueva respuesta  -----
            scrollChat();

        }

        //  -----  Manejo de errores  -----
        catch (error) {

            console.error('Error al traducir el texto:', error);
            alert('Ocurrió un error al traducir el texto. Por favor, intenta nuevamente.');
        }

        //  -----  vaciar el input  -----
        if ($inputText)
            $inputText.value = '';

    }



    /*
        ---------------------
        -----  EVENTOS  -----
        ---------------------
    */


    //  -----  Agregar evento click al botón de traducir  ----- 
    $translateButton?.addEventListener('click', generateTranslation);


    //  -----  Agregar evento keydown al input de texto para detectar Enter  -----
    $inputText?.addEventListener('keydown', (event) => {

        //  -----  Si se presiona Enter, generar la traducción  -----
        if (event.key === 'Enter' && !event.shiftKey) {

            event.preventDefault();
            
            //  -----  Generar la traducción al presionar Enter  -----
            generateTranslation();
        }

    });



})();
